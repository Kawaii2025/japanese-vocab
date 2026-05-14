/**
 * AI 接口控制器
 * 调用 AI API 生成日语例句 (OpenAI 兼容模式，支持 Qwen 和豆包，支持流式和非流式)
 */
import OpenAI from 'openai';
import getDB, { getDatabaseInfo } from '../db.js';

// 支持的 AI 提供商
const AI_PROVIDER = process.env.AI_PROVIDER || 'qwen'; // 'qwen' or 'doubao'

// 千问配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
const QWEN_API_URL = process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen-plus';

// 豆包配置
const ARK_API_KEY = process.env.ARK_API_KEY || DASHSCOPE_API_KEY;
const DOUBAO_API_URL = process.env.DOUBAO_API_URL || 'https://ark.cn-beijing.volces.com/api/v3';
const DOUBAO_MODEL = process.env.DOUBAO_MODEL || 'doubao-seed-2-0-lite-260428';

// 根据配置选择参数
const apiKey = AI_PROVIDER === 'doubao' ? ARK_API_KEY : DASHSCOPE_API_KEY;
const baseURL = AI_PROVIDER === 'doubao' ? DOUBAO_API_URL : QWEN_API_URL;
const modelName = AI_PROVIDER === 'doubao' ? DOUBAO_MODEL : QWEN_MODEL;

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
  timeout: 120000, // 120秒超时，适配更慢的模型
});

// 缓存辅助函数
async function getCachedExamples(word, kana, chinese, wordClass) {
  try {
    const db = await getDB();
    const dbInfo = getDatabaseInfo();
    const wc = Array.isArray(wordClass) ? wordClass.join(',') : (wordClass || '');
    const cacheKeyOriginal = word || null;
    const cacheKeyKana = kana;
    const cacheKeyChinese = chinese;
    const cacheKeyWordClass = wc || null;
    
    console.log('🔍 查询缓存:', {
      original: cacheKeyOriginal,
      kana: cacheKeyKana,
      chinese: cacheKeyChinese,
      wordClass: wordClass,
      wordClassProcessed: cacheKeyWordClass,
      wordClassType: typeof wordClass,
      wordClassIsArray: Array.isArray(wordClass)
    });
    
    let result;
    if (dbInfo.isNeon) {
      // PostgreSQL 版本 - 使用 IS NULL 和 = 来匹配
      result = await db.get(
        `SELECT examples_json FROM ai_examples_cache 
         WHERE (original IS NULL AND $1::text IS NULL OR original = $1)
         AND kana = $2 
         AND chinese = $3 
         AND (word_class IS NULL AND $4::text IS NULL OR word_class = $4)`,
        [cacheKeyOriginal, cacheKeyKana, cacheKeyChinese, cacheKeyWordClass]
      );
    } else {
      // SQLite 版本
      result = await db.get(
        `SELECT examples_json FROM ai_examples_cache 
         WHERE COALESCE(original, '') = COALESCE(?, '') 
         AND kana = ? 
         AND chinese = ? 
         AND COALESCE(word_class, '') = COALESCE(?, '')`,
        [cacheKeyOriginal, cacheKeyKana, cacheKeyChinese, cacheKeyWordClass]
      );
    }
    
    console.log('📊 数据库查询结果:', result);
    
    // 先查询一下数据库中所有的缓存，看看有什么
    if (!result) {
      const allResults = await db.all('SELECT * FROM ai_examples_cache LIMIT 10');
      console.log('📚 数据库中现有缓存:', allResults);
    }
    
    if (result && result.examples_json) {
      try {
        console.log('✅ 缓存命中');
        return JSON.parse(result.examples_json);
      } catch (e) {
        console.warn('缓存解析失败:', e);
        return null;
      }
    }
    console.log('❌ 缓存未命中');
    return null;
  } catch (e) {
    console.warn('缓存读取失败:', e);
    return null;
  }
}

async function saveCachedExamples(word, kana, chinese, wordClass, examples) {
  try {
    const db = await getDB();
    const dbInfo = getDatabaseInfo();
    const wc = Array.isArray(wordClass) ? wordClass.join(',') : (wordClass || '');
    const cacheKeyOriginal = word || null;
    const cacheKeyKana = kana;
    const cacheKeyChinese = chinese;
    const cacheKeyWordClass = wc || null;
    
    console.log('💾 保存缓存:', {
      original: cacheKeyOriginal,
      kana: cacheKeyKana,
      chinese: cacheKeyChinese,
      wordClass: wordClass,
      wordClassProcessed: cacheKeyWordClass,
      wordClassType: typeof wordClass,
      wordClassIsArray: Array.isArray(wordClass)
    });
    const examplesJson = JSON.stringify(examples);
    const now = Math.floor(Date.now() / 1000);
    
    if (dbInfo.isNeon) {
      // PostgreSQL 版本 - 使用 ON CONFLICT，不使用表达式索引
      // 先检查是否存在
      const existing = await db.get(
        `SELECT id FROM ai_examples_cache 
         WHERE (original IS NULL AND $1::text IS NULL OR original = $1)
         AND kana = $2 
         AND chinese = $3 
         AND (word_class IS NULL AND $4::text IS NULL OR word_class = $4)`,
        [cacheKeyOriginal, cacheKeyKana, cacheKeyChinese, cacheKeyWordClass]
      );
      
      if (existing) {
        // 更新已存在的
        await db.run(
          `UPDATE ai_examples_cache 
           SET examples_json = $2, created_at = $3
           WHERE id = $1`,
          [existing.id, examplesJson, now * 1000]
        );
      } else {
        // 插入新的
        await db.run(
          `INSERT INTO ai_examples_cache 
           (original, kana, chinese, word_class, examples_json, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [cacheKeyOriginal, cacheKeyKana, cacheKeyChinese, cacheKeyWordClass, examplesJson, now * 1000]
        );
      }
    } else {
      // SQLite 版本 - 使用 INSERT OR REPLACE
      await db.run(
        `INSERT OR REPLACE INTO ai_examples_cache 
         (original, kana, chinese, word_class, examples_json, created_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [cacheKeyOriginal, cacheKeyKana, cacheKeyChinese, cacheKeyWordClass, examplesJson, now]
      );
    }
    console.log('AI 例句已缓存');
  } catch (e) {
    console.warn('缓存保存失败:', e);
  }
}

async function clearCachedExamples(word, kana, chinese, wordClass) {
  try {
    const db = await getDB();
    const dbInfo = getDatabaseInfo();
    const wc = Array.isArray(wordClass) ? wordClass.join(',') : (wordClass || '');
    const cacheKeyOriginal = word || null;
    const cacheKeyKana = kana;
    const cacheKeyChinese = chinese;
    const cacheKeyWordClass = wc || null;
    
    if (dbInfo.isNeon) {
      // PostgreSQL 版本
      await db.run(
        `DELETE FROM ai_examples_cache 
         WHERE (original IS NULL AND $1::text IS NULL OR original = $1)
         AND kana = $2 
         AND chinese = $3 
         AND (word_class IS NULL AND $4::text IS NULL OR word_class = $4)`,
        [cacheKeyOriginal, cacheKeyKana, cacheKeyChinese, cacheKeyWordClass]
      );
    } else {
      // SQLite 版本
      await db.run(
        `DELETE FROM ai_examples_cache 
         WHERE COALESCE(original, '') = COALESCE(?, '') 
         AND kana = ? 
         AND chinese = ? 
         AND COALESCE(word_class, '') = COALESCE(?, '')`,
        [cacheKeyOriginal, cacheKeyKana, cacheKeyChinese, cacheKeyWordClass]
      );
    }
    console.log('AI 缓存已清除');
  } catch (e) {
    console.warn('缓存清除失败:', e);
  }
}

// 从字符串中提取所有完整的 JSON 对象
function extractCompleteExamples(text) {
  const examples = [];
  let braceCount = 0;
  let startIndex = -1;
  
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (braceCount === 0) {
        startIndex = i;
      }
      braceCount++;
    } else if (text[i] === '}') {
      braceCount--;
      if (braceCount === 0 && startIndex !== -1) {
        // 找到完整对象，尝试解析
        const jsonStr = text.substring(startIndex, i + 1);
        try {
          const ex = JSON.parse(jsonStr);
          // 验证必须的字段
          if (ex.japanese && ex.kana && ex.chinese) {
            examples.push({
              japanese: ex.japanese,
              kana: ex.kana,
              chinese: ex.chinese
            });
          }
        } catch (e) {
          // 忽略无法解析的
        }
        startIndex = -1;
      }
    }
  }
  
  return examples;
}

// 解析 AI 返回的内容（完整版）
function parseExamples(assistantMessage) {
  if (!assistantMessage) {
    throw new Error('Qwen API 未返回有效内容');
  }

  let examples;
  try {
    examples = JSON.parse(assistantMessage);
  } catch {
    const jsonMatch = assistantMessage.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      examples = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('无法解析 Qwen API 返回的内容');
    }
  }

  if (!Array.isArray(examples)) {
    throw new Error('Qwen API 返回格式不正确');
  }

  return examples
    .map(ex => ({
      japanese: ex.japanese || ex.jp || '',
      kana: ex.kana || '',
      chinese: ex.chinese || ex.cn || ex.zh || '',
    }))
    .filter(ex => ex.japanese && ex.kana && ex.chinese);
}

// 非流式响应
export async function generateExamples(req, res) {
  try {
    let { word, kana, chinese, wordClass = [], forceRefresh = false, disableCache = false } = req.body;
    
    // 确保 forceRefresh 是布尔值
    forceRefresh = !!forceRefresh;

    if (!word && !kana) {
      return res.status(400).json({
        success: false,
        error: '请提供单词或假名'
      });
    }

    if (!apiKey) {
      const envKey = AI_PROVIDER === 'doubao' ? 'ARK_API_KEY' : 'DASHSCOPE_API_KEY / QWEN_API_KEY';
      return res.status(500).json({
        success: false,
        error: `未配置 ${envKey}`
      });
    }

    // 检查缓存（除非强制刷新或禁用缓存）
    if (!forceRefresh && !disableCache) {
      const cached = await getCachedExamples(word, kana, chinese, wordClass);
      if (cached) {
        console.log('使用缓存的 AI 例句');
        return res.json({
          success: true,
          data: {
            examples: cached,
            cached: true,
            model: modelName
          }
        });
      }
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

    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = completion.choices?.[0]?.message?.content;
    const examples = parseExamples(assistantMessage);
    
    // 保存到缓存（除非禁用缓存）
    if (!disableCache) {
      await saveCachedExamples(word, kana, chinese, wordClass, examples);
    }

    res.json({
      success: true,
      data: {
        examples: examples,
        cached: false,
        model: modelName
      }
    });
  } catch (error) {
    console.error('生成例句失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '生成例句失败，请稍后重试',
    });
  }
}

// 流式响应 (Server-Sent Events) - 发送原始文本流
export async function generateExamplesStream(req, res) {
  try {
    let { word, kana, chinese, wordClass = [], forceRefresh = false, disableCache = false } = req.body;
    console.log('📥 收到请求:', { word, kana, chinese, wordClass, forceRefresh, disableCache });
    
    // 确保 forceRefresh 是布尔值
    forceRefresh = !!forceRefresh;

    if (!word && !kana) {
      return res.status(400).json({
        success: false,
        error: '请提供单词或假名'
      });
    }

    if (!apiKey) {
      const envKey = AI_PROVIDER === 'doubao' ? 'ARK_API_KEY' : 'DASHSCOPE_API_KEY / QWEN_API_KEY';
      return res.status(500).json({
        success: false,
        error: `未配置 ${envKey}`
      });
    }

    // 设置 SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // 发送连接成功消息
    res.write(`data: ${JSON.stringify({ type: 'status', data: '正在连接AI...' })}\n\n`);

    // 检查缓存（除非强制刷新或禁用缓存）
    if (!forceRefresh && !disableCache) {
      const cached = await getCachedExamples(word, kana, chinese, wordClass);
      if (cached) {
        console.log('使用缓存的 AI 例句');
        res.write(`data: ${JSON.stringify({ type: 'status', data: '加载缓存内容...' })}\n\n`);
        // 直接发送缓存结果，模拟流式效果
        let displayText = JSON.stringify(cached, null, 2);
        let currentPos = 0;
        
        // 模拟打字机效果
        const simulateStream = setInterval(() => {
          if (currentPos < displayText.length) {
            const chunkSize = Math.min(5, displayText.length - currentPos);
            currentPos += chunkSize;
            res.write(`data: ${JSON.stringify({ type: 'text', data: displayText.substring(0, currentPos) })}\n\n`);
          } else {
            clearInterval(simulateStream);
            res.write(`data: ${JSON.stringify({ type: 'done', data: cached, cached: true, model: modelName })}\n\n`);
            res.end();
          }
        }, 20);
        return;
      }
    }

    // 如果强制刷新且未禁用缓存，先清除旧缓存
    if (forceRefresh && !disableCache) {
      await clearCachedExamples(word, kana, chinese, wordClass);
    }

    // 发送正在生成的状态
    res.write(`data: ${JSON.stringify({ type: 'status', data: '正在生成例句...' })}\n\n`);

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

    const stream = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    let fullContent = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      fullContent += delta;
      
      // 发送原始文本流
      res.write(`data: ${JSON.stringify({ type: 'text', data: fullContent })}\n\n`);
    }

    // 发送最终结果
    const finalExamples = parseExamples(fullContent);
    // 保存到缓存（除非禁用缓存）
    if (!disableCache) {
      await saveCachedExamples(word, kana, chinese, wordClass, finalExamples);
    }
    res.write(`data: ${JSON.stringify({ type: 'done', data: finalExamples, cached: false, model: modelName })}\n\n`);
    res.end();

  } catch (error) {
    console.error('生成例句失败:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
}