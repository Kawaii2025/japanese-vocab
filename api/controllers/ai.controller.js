/**
 * AI 接口控制器
 * 调用 Qwen API 生成日语例句
 */
const QWEN_API_KEY = process.env.QWEN_API_KEY;
const QWEN_API_URL = process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen-plus';

// 生成例句
export async function generateExamples(req, res) {
  try {
    const { word, kana, chinese, wordClass = [] } = req.body;

    if (!word && !kana) {
      return res.status(400).json({
        success: false,
        error: '请提供单词或假名'
      });
    }

    if (!QWEN_API_KEY) {
      return res.status(500).json({
        success: false,
        error: '未配置 Qwen API 密钥'
      });
    }

    const systemPrompt = `你是一个专业的日语学习助手，熟悉 JLPT 考试要求。请为用户提供的日语单词生成自然实用的例句。

要求：
1. 必须符合日本母语者真实使用习惯
2. 优先使用常见固定搭配
3. 避免中文直译感
4. 不要生造搭配
5. 词汇难度控制在 JLPT N3 水平
6. 每个例句包含：
   - japanese: 日语句子（包含汉字）
   - kana: 全假名标注
   - chinese: 自然的中文翻译
7. 生成 exactly 3 个例句
8. 返回纯 JSON 格式，不要有其他文字说明、markdown 标记或代码块

返回格式示例：
[
  {
    "japanese": "私は毎日学校に行きます。",
    "kana": "わたしはまいにちがっこうにいきます。",
    "chinese": "我每天去学校。"
  }
]`;

    const userPrompt = `请为以下日语单词生成 3 个例句：
- 日语单词: ${word || kana}
- 假名: ${kana || word}
- 中文含义: ${chinese || ''}
- 词性: ${wordClass.join('、') || ''}`;

    const response = await fetch(QWEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Qwen API Error:', errorData);
      throw new Error(errorData.message || `Qwen API 调用失败 (${response.status})`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('Qwen API 未返回有效内容');
    }

    // 提取 JSON 内容
    let examples;
    try {
      // 尝试直接解析
      examples = JSON.parse(assistantMessage);
    } catch {
      // 尝试提取 JSON 部分
      const jsonMatch = assistantMessage.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        examples = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析 Qwen API 返回的内容');
      }
    }

    // 验证并格式化返回结果
    if (!Array.isArray(examples)) {
      throw new Error('Qwen API 返回格式不正确');
    }

    // 确保每个例句都有必需的字段
    examples = examples.map(ex => ({
      japanese: ex.japanese || ex.jp || '',
      kana: ex.kana || '',
      chinese: ex.chinese || ex.cn || ex.zh || '',
    })).filter(ex => ex.japanese && ex.chinese);

    if (examples.length === 0) {
      throw new Error('生成的例句无效');
    }

    res.json({
      success: true,
      data: examples,
    });
  } catch (error) {
    console.error('生成例句失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '生成例句失败，请稍后重试',
    });
  }
}
