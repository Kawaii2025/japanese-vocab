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

    const systemPrompt = `你是一名专业的日语母语教师。请为用户提供的日语单词生成 3 个自然、实用、符合日本母语者习惯的例句。

要求：
- 必须是日本人真实会说的自然日语
- 优先使用最常见、最典型的固定搭配
- 避免中文直译感
- 不要生造搭配
- 不要为了"高级"而故意写得文学化或过于书面
- 例句要适合日语学习者学习实际用法
- 尽量覆盖不同使用场景
- 使用现代日语表达
- 句子长度适中，不要过长
- JLPT N3 左右难度
- 假名必须完整标注
- 中文翻译自然通顺

返回格式必须严格遵守：
[
  {
    "japanese": "例句",
    "kana": "全假名标注",
    "chinese": "中文翻译"
  }
]

如果这个词有固定搭配限制，请优先使用最自然、最常见的搭配。`;

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
