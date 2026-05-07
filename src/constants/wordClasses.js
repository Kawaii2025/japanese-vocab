export const WORD_CLASSES = [
  {
    key: 'noun',
    labelZh: '名词',
    labelJa: '名詞'
  },
  {
    key: 'adverb',
    labelZh: '副词',
    labelJa: '副詞'
  },
  {
    key: 'i_adjective',
    labelZh: 'イ形容词',
    labelJa: 'イ形容詞'
  },
  {
    key: 'na_adjective',
    labelZh: 'ナ形容词',
    labelJa: 'ナ形容詞'
  },
  {
    key: 'intransitive_verb',
    labelZh: '自动词',
    labelJa: '自動詞'
  },
  {
    key: 'transitive_verb',
    labelZh: '他动词',
    labelJa: '他動詞'
  }
];

export function getWordClassLabel(key, lang = 'zh') {
  const wordClass = WORD_CLASSES.find(wc => wc.key === key);
  if (!wordClass) return '-';
  return lang === 'ja' ? wordClass.labelJa : wordClass.labelZh;
}
