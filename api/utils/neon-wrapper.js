/**
 * Database wrapper to provide SQLite-compatible API for Neon PostgreSQL
 * Converts db.get() and db.all() calls to PostgreSQL queries
 */

export function createNeonWrapper(pool) {
  return {
    async get(query, ...params) {
      try {
        // Convert ? placeholders to $1, $2 format for PostgreSQL
        let pgQuery = query;
        for (let i = 0; i < params.length; i++) {
          pgQuery = pgQuery.replace('?', `$${i + 1}`);
        }

        const result = await pool.query(pgQuery, params);
        return result.rows[0] || null;
      } catch (err) {
        console.error('🔴 Neon GET Error:', err.message);
        console.error('Query:', query);
        console.error('Params:', params);
        throw err;
      }
    },

    async all(query, ...params) {
      try {
        // Convert ? placeholders to $1, $2 format for PostgreSQL
        let pgQuery = query;
        for (let i = 0; i < params.length; i++) {
          pgQuery = pgQuery.replace('?', `$${i + 1}`);
        }

        const result = await pool.query(pgQuery, params);
        return result.rows || [];
      } catch (err) {
        console.error('🔴 Neon ALL Error:', err.message);
        console.error('Query:', query);
        console.error('Params:', params);
        throw err;
      }
    },

    async run(query, ...params) {
      try {
        // Convert ? placeholders to $1, $2 format for PostgreSQL
        let pgQuery = query;
        for (let i = 0; i < params.length; i++) {
          pgQuery = pgQuery.replace('?', `$${i + 1}`);
        }

        const result = await pool.query(pgQuery, params);
        return {
          lastID: result.rows[0]?.id || null,
          changes: result.rowCount || 0
        };
      } catch (err) {
        console.error('🔴 Neon RUN Error:', err.message);
        console.error('Query:', query);
        console.error('Params:', params);
        throw err;
      }
    },

    async exec(queries) {
      try {
        // Split multiple SQL statements and execute them
        const statements = queries.split(';').filter(s => s.trim());
        for (const statement of statements) {
          if (statement.trim()) {
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
      await pool.end();
    }
  };
}
