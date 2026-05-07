export const WORD_CLASSES = [
  {
    key: 'noun',
    label_zh: '名词',
    label_ja: '名詞',
    short: '名',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    key: 'adverb',
    label_zh: '副词',
    label_ja: '副詞',
    short: '副',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    key: 'i_adjective',
    label_zh: 'イ形容词',
    label_ja: 'イ形容詞',
    short: 'イ形',
    color: 'bg-green-100 text-green-800'
  },
  {
    key: 'na_adjective',
    label_zh: 'ナ形容词',
    label_ja: 'ナ形容詞',
    short: 'ナ形',
    color: 'bg-teal-100 text-teal-800'
  },
  {
    key: 'intransitive_verb',
    label_zh: '自动词',
    label_ja: '自動詞',
    short: '自动',
    color: 'bg-orange-100 text-orange-800'
  },
  {
    key: 'transitive_verb',
    label_zh: '他动词',
    label_ja: '他動詞',
    short: '他动',
    color: 'bg-red-100 text-red-800'
  }
];

export function normalizeWordClasses(wordClasses) {
  if (!wordClasses) return [];
  if (Array.isArray(wordClasses)) {
    return wordClasses.filter(c => WORD_CLASSES.some(wc => wc.key === c));
  }
  if (typeof wordClasses === 'string') {
    const trimmed = wordClasses.trim();
    if (trimmed) {
      // Check if it's a valid class
      if (WORD_CLASSES.some(wc => wc.key === trimmed)) {
        return [trimmed];
      }
    }
  }
  return [];
}

export function getWordClassLabel(wordClasses, lang = 'zh') {
  const classes = normalizeWordClasses(wordClasses);
  if (classes.length === 0) return '-';
  return classes.map(key => {
    const wc = WORD_CLASSES.find(w => w.key === key);
    return wc ? (lang === 'ja' ? wc.label_ja : wc.label_zh) : '';
  }).filter(Boolean).join(' / ');
}

export function getWordClassShort(wordClasses) {
  const classes = normalizeWordClasses(wordClasses);
  if (classes.length === 0) return [];
  return classes.map(key => {
    const wc = WORD_CLASSES.find(w => w.key === key);
    return wc ? wc.short : '';
  }).filter(Boolean);
}

export function getWordClassColor(key) {
  const wordClass = WORD_CLASSES.find(wc => wc.key === key);
  return wordClass ? wordClass.color : 'bg-gray-100 text-gray-800';
}
