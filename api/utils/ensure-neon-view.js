/**
 * Ensure a readable timestamp view exists in Neon after sync operations.
 */
export async function ensureVocabularyReadableView(pool) {
  await pool.query(`
    CREATE OR REPLACE VIEW vocabulary_readable AS
    SELECT
      *,
      to_timestamp(created_at::bigint / 1000) AS created_at_readable,
      to_timestamp(updated_at::bigint / 1000) AS updated_at_readable
    FROM vocabulary
  `);
}
