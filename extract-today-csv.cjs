#!/usr/bin/env node
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('api/data/exports/vocabulary-today-2026-04-22.json', 'utf8'));
const rows = data.data || [];

// Create CSV header
const header = 'chinese,original,kana,category,difficulty,input_date,next_review_date,review_count,mastery_level,created_at,updated_at';

// Convert rows to CSV (escape quotes/commas properly)
const csvRows = rows.map(row => {
  const fields = [
    (row.chinese || '').replace(/"/g, '""'),
    (row.original || '').replace(/"/g, '""'),
    (row.kana || '').replace(/"/g, '""'),
    (row.category || '').replace(/"/g, '""'),
    row.difficulty || '',
    row.input_date || '',
    row.next_review_date || '',
    row.review_count || 0,
    row.mastery_level || 0,
    row.created_at || '',
    row.updated_at || ''
  ];
  
  return fields.map(v => {
    const str = String(v);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str}"`;
    }
    return str;
  }).join(',');
});

const csv = header + '\n' + csvRows.join('\n');
fs.writeFileSync('today-words-2026-04-22.csv', csv);
console.log('✅ CSV created: today-words-2026-04-22.csv');
console.log(`📝 Records: ${rows.length}`);
