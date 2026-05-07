export const WORD_CLASSES = [
  {
    key: 'noun',
    labelZh: '名词',
    labelJa: '名詞',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    key: 'adverb',
    labelZh: '副词',
    labelJa: '副詞',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    key: 'i_adjective',
    labelZh: 'イ形容词',
    labelJa: 'イ形容詞',
    color: 'bg-green-100 text-green-800'
  },
  {
    key: 'na_adjective',
    labelZh: 'ナ形容词',
    labelJa: 'ナ形容詞',
    color: 'bg-teal-100 text-teal-800'
  },
  {
    key: 'intransitive_verb',
    labelZh: '自动词',
    labelJa: '自動詞',
    color: 'bg-orange-100 text-orange-800'
  },
  {
    key: 'transitive_verb',
    labelZh: '他动词',
    labelJa: '他動詞',
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
    return wc ? (lang === 'ja' ? wc.labelJa : wc.labelZh) : '';
  }).filter(Boolean).join(' / ');
}

export function getWordClassColor(key) {
  const wordClass = WORD_CLASSES.find(wc => wc.key === key);
  return wordClass ? wordClass.color : 'bg-gray-100 text-gray-800';
}
