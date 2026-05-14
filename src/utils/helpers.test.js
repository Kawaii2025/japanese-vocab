// 测试振假名转换函数
import { furiganaToRuby } from './helpers.js';

// 测试用例
const testCases = [
  // Case 1: 纯汉字
  {
    name: '纯汉字 - 私',
    input: '私（わたし）',
    expected: '<ruby>私<rt>わたし</rt></ruby>'
  },
  {
    name: '纯汉字 - 日本語',
    input: '日本語（にほんご）',
    expected: '<ruby>日本語<rt>にほんご</rt></ruby>'
  },
  
  // Case 2: 汉字+平假名混合
  {
    name: '汉字+平假名 - 一番乗り',
    input: '一番乗り（いちばんのり）',
    expected: '<ruby>一番乗り<rt>いちばんのり</rt></ruby>'
  },
  {
    name: '汉字+平假名 - 食べる',
    input: '食べる（たべる）',
    expected: '<ruby>食べる<rt>たべる</rt></ruby>'
  },
  {
    name: '汉字+平假名 - 見る',
    input: '見る（みる）',
    expected: '<ruby>見る<rt>みる</rt></ruby>'
  },
  
  // Case 3: 汉字+片假名混合
  {
    name: '汉字+片假名 - 食べる',
    input: '食べる（タベル）',
    expected: '<ruby>食べる<rt>タベル</rt></ruby>'
  },
  
  // Case 4: 汉字+重复符号
  {
    name: '汉字+重复符号 - 日々',
    input: '日々（ひび）',
    expected: '<ruby>日々<rt>ひび</rt></ruby>'
  },
  {
    name: '汉字+重复符号 - 人々',
    input: '人々（ひとびと）',
    expected: '<ruby>人々<rt>ひとびと</rt></ruby>'
  },
  {
    name: '汉字+重复符号 - 時々',
    input: '時々（ときどき）',
    expected: '<ruby>時々<rt>ときどき</rt></ruby>'
  },
  {
    name: '汉字+重复符号 - 色々',
    input: '色々（いろいろ）',
    expected: '<ruby>色々<rt>いろいろ</rt></ruby>'
  },
  
  // Case 5: 汉字+重复符号+假名
  {
    name: '汉字+重复符号+假名 - 色々な',
    input: '色々な（いろいろな）',
    expected: '<ruby>色々な<rt>いろいろな</rt></ruby>'
  },
  
  // Case 6: 多个振假名在一句话中
  {
    name: '多个振假名 - 一句话',
    input: '私（わたし）は日本語（にほんご）を勉強（べんきょう）しています',
    expected: '<ruby>私<rt>わたし</rt></ruby>は<ruby>日本語<rt>にほんご</rt></ruby>を<ruby>勉強<rt>べんきょう</rt></ruby>しています'
  },
  
  // Case 7: 复杂的句子
  {
    name: '复杂句子',
    input: '今日（きょう）は一番乗り（いちばんのり）で会社（かいしゃ）に着（つ）きました。時々（ときどき）日々（ひび）の努力（どりょく）が報（むく）われます',
    expected: '<ruby>今日<rt>きょう</rt></ruby>は<ruby>一番乗り<rt>いちばんのり</rt></ruby>で<ruby>会社<rt>かいしゃ</rt></ruby>に<ruby>着<rt>つ</rt></ruby>きました。<ruby>時々<rt>ときどき</rt></ruby><ruby>日々<rt>ひび</rt></ruby>の<ruby>努力<rt>どりょく</rt></ruby>が<ruby>報<rt>むく</rt></ruby>われます'
  }
];

// 运行测试
console.log('🧪 开始测试 furiganaToRuby 函数\n');

let passedCount = 0;
let failedCount = 0;

testCases.forEach((testCase, index) => {
  const result = furiganaToRuby(testCase.input);
  const passed = result === testCase.expected;
  
  if (passed) {
    passedCount++;
    console.log(`✅ ${index + 1}. ${testCase.name}`);
    console.log(`   输入: ${testCase.input}`);
    console.log(`   输出: ${result}\n`);
  } else {
    failedCount++;
    console.log(`❌ ${index + 1}. ${testCase.name}`);
    console.log(`   输入: ${testCase.input}`);
    console.log(`   期望: ${testCase.expected}`);
    console.log(`   实际: ${result}\n`);
  }
});

// 统计结果
console.log('📊 测试结果:');
console.log(`   总计: ${testCases.length}`);
console.log(`   通过: ${passedCount} ✅`);
console.log(`   失败: ${failedCount} ❌`);

if (failedCount === 0) {
  console.log('\n🎉 所有测试通过！');
} else {
  console.log('\n⚠️  有测试失败，请检查代码！');
}
