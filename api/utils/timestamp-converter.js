/**
 * Normalize mixed timestamp/date formats into a Unix-millisecond value.
 * Supports:
 * - Unix seconds (number/string)
 * - Unix milliseconds (number/string)
 * - YYYY-MM-DD
 * - ISO datetime strings
 */
export function normalizeToUnixMs(value) {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Prefer explicit date/datetime parsing for human-readable strings.
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parsed = Date.parse(`${trimmed}T00:00:00.000Z`);
      return Number.isNaN(parsed) ? null : parsed;
    }

    const parsedDate = Date.parse(trimmed);
    if (!Number.isNaN(parsedDate) && /[-:T/]/.test(trimmed)) {
      return parsedDate;
    }

    const numeric = Number(trimmed);
    if (Number.isNaN(numeric)) return null;
    return Math.abs(numeric) >= 1e12 ? numeric : numeric * 1000;
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) return null;
  return Math.abs(numeric) >= 1e12 ? numeric : numeric * 1000;
}

export function toTimestampMs(value) {
  return normalizeToUnixMs(value);
}

export function toDateString(value) {
  const ms = normalizeToUnixMs(value);
  if (ms === null) return null;
  try {
    return new Date(ms).toISOString().split('T')[0];
  } catch {
    return null;
  }
}

export function toIsoTimestamp(value) {
  const ms = normalizeToUnixMs(value);
  if (ms === null) return null;
  try {
    return new Date(ms).toISOString();
  } catch {
    return null;
  }
}
