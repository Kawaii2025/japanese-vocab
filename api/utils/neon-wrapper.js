/**
 * Database wrapper to provide SQLite-compatible API for Neon PostgreSQL
 * Converts db.get() and db.all() calls to PostgreSQL queries
 */

function convertQueryPlaceholders(query, params) {
  // Replace ? with $1, $2, etc for PostgreSQL
  let pgQuery = query;
  let paramIndex = 1;
  
  // Replace all ? with $1, $2, etc
  while (pgQuery.includes('?')) {
    pgQuery = pgQuery.replace('?', `$${paramIndex}`);
    paramIndex++;
  }
  
  console.log('🔄 Converted query:', { original: query, converted: pgQuery, params });
  return pgQuery;
}

export function createNeonWrapper(pool) {
  return {
    async get(query, ...params) {
      try {
        const pgQuery = convertQueryPlaceholders(query, params);
        console.log('📊 Neon GET:', { query: pgQuery, params });
        
        const result = await pool.query(pgQuery, params);
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
        const pgQuery = convertQueryPlaceholders(query, params);
        console.log('📊 Neon ALL:', { query: pgQuery, params });
        
        const result = await pool.query(pgQuery, params);
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
        const pgQuery = convertQueryPlaceholders(query, params);
        console.log('📊 Neon RUN:', { query: pgQuery, params });
        
        const result = await pool.query(pgQuery, params);
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
