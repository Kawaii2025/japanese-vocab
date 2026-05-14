import { describe, it, expect } from 'vitest';
import { furiganaToRuby } from './helpers.js';

describe('furiganaToRuby', () => {
  // 纯汉字
  it('should convert pure kanji', () => {
    expect(furiganaToRuby('私（わたし）')).toBe('<ruby>私<rt>わたし</rt></ruby>');
    expect(furiganaToRuby('日本語（にほんご）')).toBe('<ruby>日本語<rt>にほんご</rt></ruby>');
  });

  // 汉字+平假名混合
  it('should convert kanji with hiragana', () => {
    expect(furiganaToRuby('一番乗り（いちばんのり）')).toBe('<ruby>一番乗り<rt>いちばんのり</rt></ruby>');
    expect(furiganaToRuby('食べる（たべる）')).toBe('<ruby>食べる<rt>たべる</rt></ruby>');
    expect(furiganaToRuby('見る（みる）')).toBe('<ruby>見る<rt>みる</rt></ruby>');
  });

  // 汉字+片假名混合
  it('should convert kanji with katakana', () => {
    expect(furiganaToRuby('食べる（タベル）')).toBe('<ruby>食べる<rt>タベル</rt></ruby>');
  });

  // 汉字+重复符号
  it('should convert kanji with repetition symbol', () => {
    expect(furiganaToRuby('日々（ひび）')).toBe('<ruby>日々<rt>ひび</rt></ruby>');
    expect(furiganaToRuby('人々（ひとびと）')).toBe('<ruby>人々<rt>ひとびと</rt></ruby>');
    expect(furiganaToRuby('時々（ときどき）')).toBe('<ruby>時々<rt>ときどき</rt></ruby>');
    expect(furiganaToRuby('色々（いろいろ）')).toBe('<ruby>色々<rt>いろいろ</rt></ruby>');
  });

  // 汉字+重复符号+假名
  it('should convert kanji with repetition symbol and hiragana', () => {
    expect(furiganaToRuby('色々な（いろいろな）')).toBe('<ruby>色々な<rt>いろいろな</rt></ruby>');
  });

  // 多个振假名在一句话中
  it('should convert multiple furigana in one sentence', () => {
    expect(furiganaToRuby('私（わたし）は日本語（にほんご）を勉強（べんきょう）しています'))
      .toBe('<ruby>私<rt>わたし</rt></ruby>は<ruby>日本語<rt>にほんご</rt></ruby>を<ruby>勉強<rt>べんきょう</rt></ruby>しています');
  });

  // 复杂的句子
  it('should convert complex sentence', () => {
    expect(furiganaToRuby('今日（きょう）は一番乗り（いちばんのり）で会社（かいしゃ）に着（つ）きました。時々（ときどき）日々（ひび）の努力（どりょく）が報（むく）われます'))
      .toBe('<ruby>今日<rt>きょう</rt></ruby>は<ruby>一番乗り<rt>いちばんのり</rt></ruby>で<ruby>会社<rt>かいしゃ</rt></ruby>に<ruby>着<rt>つ</rt></ruby>きました。<ruby>時々<rt>ときどき</rt></ruby><ruby>日々<rt>ひび</rt></ruby>の<ruby>努力<rt>どりょく</rt></ruby>が<ruby>報<rt>むく</rt></ruby>われます');
  });
});
