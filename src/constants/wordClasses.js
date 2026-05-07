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

export function getWordClassLabel(key, lang = 'zh') {
  const wordClass = WORD_CLASSES.find(wc => wc.key === key);
  if (!wordClass) return '-';
  return lang === 'ja' ? wordClass.labelJa : wordClass.labelZh;
}

export function getWordClassColor(key) {
  const wordClass = WORD_CLASSES.find(wc => wc.key === key);
  return wordClass ? wordClass.color : 'bg-gray-100 text-gray-800';
}
