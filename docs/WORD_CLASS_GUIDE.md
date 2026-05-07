# Word Class (词性) Guide

This guide explains how the Japanese vocabulary app handles word classes (品詞).

## Overview

The app supports **multiple word classes per word** using a JSON serialized array stored in the database.

## Word Class Definitions

| Key | Chinese Label (labelZh) | Japanese Label (labelJa) | Color | Description |
|-----|------------------------|-------------------------|-------|-------------|
| `noun` | 名词 | 名詞 | Blue | A noun (meishi) - person, place, thing, or idea |
| `adverb` | 副词 | 副詞 | Purple | An adverb (fukushi) - modifies a verb, adjective, or other adverb |
| `i_adjective` | イ形容词 | イ形容詞 | Green | An i-adjective (i-keiyōshi) - ends in い, conjugates like verbs |
| `na_adjective` | ナ形容词 | ナ形容詞 | Teal | A na-adjective (na-keiyōshi) - requires な when modifying nouns |
| `intransitive_verb` | 自动词 | 自動詞 | Orange | An intransitive verb (jidoshi) - no direct object, "does something on its own" |
| `transitive_verb` | 他动词 | 他動詞 | Red | A transitive verb (tadoshi) - takes a direct object marked by を |

## Data Storage

### Database Column
- Table: `vocabulary`
- Column: `word_class` (TEXT type)
- Stores JSON serialized array

### Examples:
```sql
-- Single word class: noun
word_class = '["noun"]'

-- Multiple word classes: i-adjective + adverb
word_class = '["i_adjective", "adverb"]'

-- No word class
word_class = NULL
```

## Frontend Components

### 1. Add Words Table (`/add-table`)
- Uses multi-select dropdown with checkboxes
- Shows selected word classes as colored tags
- Stores as array in Vue state

### 2. Management Page (`/management`)
- Shows colored tags for each word's word classes
- In edit mode: multi-select dropdown with checkboxes

### 3. Practice Page (`/`)
- Shows colored tags in the vocabulary table
- Read-only display

## Core Constants & Helpers

Located in `src/constants/wordClasses.js`:

### `WORD_CLASSES`
Array of all available word classes with labels and colors.

### `normalizeWordClasses(wordClasses)`
Converts various input formats to a valid array of word class keys.
- Handles NULL → []
- Handles single string → ["key"]
- Handles JSON string → parsed array
- Filters invalid keys

### `getWordClassLabel(wordClasses, lang)`
Gets human-readable labels for word classes.
- `lang` can be "zh" (Chinese) or "ja" (Japanese)
- Multiple classes joined with " / "

### `getWordClassColor(key)`
Gets Tailwind CSS color classes for a word class.

## Backend API

Located in `api/controllers/vocabulary.controller.js`:

### `serializeWordClass(wordClass)`
Converts array to JSON string for database storage.
- Empty array → NULL
- Array → JSON string

### `deserializeWordClass(wordClass)`
Converts JSON string from database back to array.
- NULL → []
- JSON string → parsed array
- Legacy single value → [value]

## Database Schema

### SQLite
```sql
CREATE TABLE vocabulary (
  ...
  word_class TEXT,
  ...
);
```

### PostgreSQL (Neon)
```sql
CREATE TABLE vocabulary (
  ...
  word_class VARCHAR(50),  -- Stores JSON string
  ...
);
```

### View
```sql
CREATE OR REPLACE VIEW vocabulary_readable AS 
SELECT 
  *, 
  to_timestamp(created_at::bigint / 1000) AS created_at_readable, 
  to_timestamp(updated_at::bigint / 1000) AS updated_at_readable 
FROM vocabulary;
```

## Sync to Neon

All sync scripts handle `word_class` field:
- `sync-to-neon.js`
- `sync-vocabulary-to-neon.js`
- `sync-to-neon-partial.js`

These scripts copy the `word_class` TEXT column directly (no transformation needed).

## Usage Examples

### Example 1: Single Word Class
Word: りんご (apple)
- Word class: 名词 (noun)
- Database: `'["noun"]'`
- Display: 🔵 名词

### Example 2: Multiple Word Classes
Word: 多い (many/often)
- Word classes: イ形容词 (i-adjective) + 副词 (adverb)
- Database: `'["i_adjective", "adverb"]'`
- Display: 🟢 イ形容词 / 🟣 副词

### Example 3: No Word Class
- Database: `NULL`
- Display: -

## Color Reference

All colors use Tailwind CSS utility classes:
- `bg-blue-100 text-blue-800` - Noun
- `bg-purple-100 text-purple-800` - Adverb
- `bg-green-100 text-green-800` - I-Adjective
- `bg-teal-100 text-teal-800` - Na-Adjective
- `bg-orange-100 text-orange-800` - Intransitive Verb
- `bg-red-100 text-red-800` - Transitive Verb

## Migration from Single Word Class

If you have existing data with single word class strings (e.g., `'noun'` instead of `'["noun"]'`), the `deserializeWordClass` function will automatically convert them to arrays for backward compatibility.

## Adding New Word Classes

To add a new word class:

1. Add to `WORD_CLASSES` array in `src/constants/wordClasses.js`
2. Assign a unique key and color
3. The UI will automatically include it in dropdowns and displays
