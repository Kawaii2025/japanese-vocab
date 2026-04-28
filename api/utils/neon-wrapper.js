/**
 * Database wrapper to provide SQLite-compatible API for Neon PostgreSQL
 * Converts db.get() and db.all() calls to PostgreSQL queries
 */

// Mark a value as raw SQL to be injected directly (not parameterized)
export class RawSQL {
  constructor(sql) {
    this.sql = sql;
  }
}

// Helper to detect and wrap raw SQL expressions
export function wrapRawSQL(value) {
  if (value instanceof RawSQL) return value;
  if (typeof value === 'string' && (value.includes('NOW()') || value.includes('date(') || value.includes('strftime('))) {
    return new RawSQL(value);
  }
  return value;
}

function convertQueryPlaceholders(query, params) {
  // Convert SQLite functions to PostgreSQL equivalents
  let pgQuery = query;

  // Convert SQLite unixepoch date conversion to PostgreSQL Beijing date.
  // Example: date(created_at / 1000, 'unixepoch', '+8 hours')
  pgQuery = pgQuery.replace(
    /date\(\s*([^,]+?)\s*,\s*'unixepoch'\s*,\s*'\+8 hours'\s*\)/gi,
    "(timezone('Asia/Shanghai', to_timestamp($1)))::date"
  );

  // Convert DATE(bigint_ms_column) fallbacks used in SQLite to PostgreSQL date extraction.
  pgQuery = pgQuery.replace(
    /date\(\s*(created_at|updated_at|practice_date|next_review_date|practiced_at)\s*\)/gi,
    "(timezone('Asia/Shanghai', to_timestamp($1 / 1000.0)))::date"
  );
  
  // Convert date('now') to CURRENT_DATE
  pgQuery = pgQuery.replace(/date\('now'\)/gi, 'CURRENT_DATE');
  
  // Convert strftime to PostgreSQL to_char
  pgQuery = pgQuery.replace(/strftime\('%Y-%m-%d', 'now'\)/gi, "CURRENT_DATE");
  
  // Convert date math: date('now', '+N days') to CURRENT_DATE + INTERVAL 'N days'
  pgQuery = pgQuery.replace(/date\('now',\s*'\+'\s*\|\|\s*\?\s*\|\|\s*'days'\)/gi, "(CURRENT_DATE + INTERVAL '1 day' * ?)");
  
  // Track which params are raw SQL
  const rawSQLParams = {};
  const cleanParams = [];
  let paramIndex = 1;
  
  // Separate regular params from raw SQL
  for (let i = 0; i < params.length; i++) {
    if (params[i] instanceof RawSQL) {
      rawSQLParams[i] = params[i].sql;
    } else {
      cleanParams.push(params[i]);
    }
  }
  
  // Replace ? with $1, $2, etc, handling raw SQL specially
  let cleanParamIndex = 1;
  let questionMarkIndex = 0;
  
  while (pgQuery.includes('?')) {
    if (rawSQLParams.hasOwnProperty(questionMarkIndex)) {
      // Replace with raw SQL (not parameterized)
      pgQuery = pgQuery.replace('?', rawSQLParams[questionMarkIndex]);
    } else {
      // Replace with parameter placeholder
      pgQuery = pgQuery.replace('?', `$${cleanParamIndex}`);
      cleanParamIndex++;
    }
    questionMarkIndex++;
  }
  
  console.log('🔄 Converted query:', { 
    original: query, 
    converted: pgQuery, 
    cleanParams,
    rawParams: rawSQLParams
  });
  return { pgQuery, cleanParams };
}

export function createNeonWrapper(pool) {
  return {
    async get(query, ...params) {
      try {
        const { pgQuery, cleanParams } = convertQueryPlaceholders(query, params);
        console.log('📊 Neon GET:', { query: pgQuery, params: cleanParams });
        
        const result = await pool.query(pgQuery, cleanParams);
        return result.rows[0] || null;
      } catch (err) {
        console.error('🔴 Neon GET Error:', err.message);
        console.error('   Query:', query);
        console.error('   Params:', params);
        throw err;
      }
    },

    async all(query, ...params) {
      try {
        const { pgQuery, cleanParams } = convertQueryPlaceholders(query, params);
        console.log('📊 Neon ALL:', { query: pgQuery, params: cleanParams });
        
        const result = await pool.query(pgQuery, cleanParams);
        return result.rows || [];
      } catch (err) {
        console.error('🔴 Neon ALL Error:', err.message);
        console.error('   Query:', query);
        console.error('   Params:', params);
        throw err;
      }
    },

    async run(query, ...params) {
      try {
        const { pgQuery, cleanParams } = convertQueryPlaceholders(query, params);
        console.log('📊 Neon RUN:', { query: pgQuery, params: cleanParams });
        
        const result = await pool.query(pgQuery, cleanParams);
        return {
          lastID: result.rows[0]?.id || null,
          changes: result.rowCount || 0
        };
      } catch (err) {
        console.error('🔴 Neon RUN Error:', err.message);
        console.error('   Query:', query);
        console.error('   Params:', params);
        throw err;
      }
    },

    async exec(queries) {
      try {
        // Split multiple SQL statements and execute them
        const statements = queries.split(';').filter(s => s.trim());
        for (const statement of statements) {
          if (statement.trim()) {
            console.log('📊 Neon EXEC:', statement.substring(0, 50) + '...');
            await pool.query(statement);
          }
        }
        return true;
      } catch (err) {
        console.error('🔴 Neon EXEC Error:', err.message);
        throw err;
      }
    },

    async close() {
      try {
        await pool.end();
      } catch (err) {
        console.warn('⚠️  Error closing Neon pool:', err.message);
      }
    }
  };
}
