-- ========================================
-- 单词数据插入脚本
-- 包含常用的 N5-N1 日语单词
-- ========================================

-- N5 基础单词（最简单）
INSERT INTO vocabulary (chinese, original, kana, category, difficulty, word_class) VALUES
-- 问候语
('你好', 'こんにちは', 'こんにちは', 'N5', 1, 'noun'),
('早上好', 'おはよう', 'おはよう', 'N5', 1, 'noun'),
('晚上好', 'こんばんは', 'こんばんは', 'N5', 1, 'noun'),
('再见', 'さようなら', 'さようなら', 'N5', 1, 'noun'),
('谢谢', 'ありがとう', 'ありがとう', 'N5', 1, 'noun'),
('对不起', 'すみません', 'すみません', 'N5', 1, 'noun'),
('不好意思', 'ごめんなさい', 'ごめんなさい', 'N5', 1, 'noun'),
('请', 'どうぞ', 'どうぞ', 'N5', 1, 'noun'),

-- 基本词汇
('是的', 'はい', 'はい', 'N5', 1, 'interjection'),
('不是', 'いいえ', 'いいえ', 'N5', 1, 'interjection'),
('什么', '何', 'なに', 'N5', 1, 'noun'),
('谁', '誰', 'だれ', 'N5', 1, 'noun'),
('哪里', 'どこ', 'どこ', 'N5', 1, 'noun'),
('什么时候', 'いつ', 'いつ', 'N5', 1, 'adverb'),
('为什么', 'どうして', 'どうして', 'N5', 1, 'adverb'),
('怎么样', 'どう', 'どう', 'N5', 1, 'adverb'),

-- 数字
('一', '一', 'いち', 'N5', 1, 'noun'),
('二', '二', 'に', 'N5', 1, 'noun'),
('三', '三', 'さん', 'N5', 1, 'noun'),
('十', '十', 'じゅう', 'N5', 1, 'noun'),
('百', '百', 'ひゃく', 'N5', 1, 'noun'),
('千', '千', 'せん', 'N5', 1, 'noun'),
('万', '万', 'まん', 'N5', 1, 'noun'),

-- 时间
('今天', '今日', 'きょう', 'N5', 1, 'noun'),
('明天', '明日', 'あした', 'N5', 1, 'noun'),
('昨天', '昨日', 'きのう', 'N5', 1, 'noun'),
('现在', '今', 'いま', 'N5', 1, 'noun'),
('上午', '午前', 'ごぜん', 'N5', 1, 'noun'),
('下午', '午後', 'ごご', 'N5', 1, 'noun'),

-- 人物
('我', '私', 'わたし', 'N5', 1, 'noun'),
('你', 'あなた', 'あなた', 'N5', 1, 'noun'),
('他/她', '彼/彼女', 'かれ/かのじょ', 'N5', 1, 'noun'),
('朋友', '友達', 'ともだち', 'N5', 1, 'noun'),
('老师', '先生', 'せんせい', 'N5', 1, 'noun'),
('学生', '学生', 'がくせい', 'N5', 1, 'noun');

-- N4 基础单词
INSERT INTO vocabulary (chinese, original, kana, category, difficulty, word_class) VALUES
-- 动词
('做', 'する', 'する', 'N4', 2, 'verb'),
('去', '行く', 'いく', 'N4', 2, 'verb'),
('来', '来る', 'くる', 'N4', 2, 'verb'),
('吃', '食べる', 'たべる', 'N4', 2, 'verb'),
('喝', '飲む', 'のむ', 'N4', 2, 'verb'),
('看', '見る', 'みる', 'N4', 2, 'verb'),
('听', '聞く', 'きく', 'N4', 2, 'verb'),
('说', '言う', 'いう', 'N4', 2, 'verb'),
('读', '読む', 'よむ', 'N4', 2, 'verb'),
('写', '書く', 'かく', 'N4', 2, 'verb'),
('买', '買う', 'かう', 'N4', 2, 'verb'),
('卖', '売る', 'うる', 'N4', 2, 'verb'),

-- 形容词
('大', '大きい', 'おおきい', 'N4', 2, 'adjective'),
('小', '小さい', 'ちいさい', 'N4', 2, 'adjective'),
('多', '多い', 'おおい', 'N4', 2, 'adjective'),
('少', '少ない', 'すくない', 'N4', 2, 'adjective'),
('好', '良い', 'よい', 'N4', 2, 'adjective'),
('坏', '悪い', 'わるい', 'N4', 2, 'adjective'),
('新', '新しい', 'あたらしい', 'N4', 2, 'adjective'),
('旧', '古い', 'ふるい', 'N4', 2, 'adjective'),

-- 名词
('学校', '学校', 'がっこう', 'N4', 2, 'noun'),
('公司', '会社', 'かいしゃ', 'N4', 2, 'noun'),
('家', '家', 'いえ', 'N4', 2, 'noun'),
('车站', '駅', 'えき', 'N4', 2, 'noun'),
('电话', '電話', 'でんわ', 'N4', 2, 'noun'),
('电脑', 'パソコン', 'ぱそこん', 'N4', 2, 'noun');

-- N3 进阶单词
INSERT INTO vocabulary (chinese, original, kana, category, difficulty, word_class) VALUES
-- 常用动词
('理解', '分かる', 'わかる', 'N3', 3, 'verb'),
('记住', '覚える', 'おぼえる', 'N3', 3, 'verb'),
('忘记', '忘れる', 'わすれる', 'N3', 3, 'verb'),
('教', '教える', 'おしえる', 'N3', 3, 'verb'),
('学习', '勉強する', 'べんきょうする', 'N3', 3, 'verb'),
('工作', '働く', 'はたらく', 'N3', 3, 'verb'),
('休息', '休む', 'やすむ', 'N3', 3, 'verb'),
('帮助', '手伝う', 'てつだう', 'N3', 3, 'verb'),
('借', '借りる', 'かりる', 'N3', 3, 'verb'),
('还', '返す', 'かえす', 'N3', 3, 'verb'),

-- 抽象名词
('时间', '時間', 'じかん', 'N3', 3, 'noun'),
('机会', 'チャンス', 'ちゃんす', 'N3', 3, 'noun'),
('问题', '問題', 'もんだい', 'N3', 3, 'noun'),
('答案', '答え', 'こたえ', 'N3', 3, 'noun'),
('意见', '意見', 'いけん', 'N3', 3, 'noun'),
('经验', '経験', 'けいけん', 'N3', 3, 'noun'),
('文化', '文化', 'ぶんか', 'N3', 3, 'noun'),
('历史', '歴史', 'れきし', 'N3', 3, 'noun'),
('社会', '社会', 'しゃかい', 'N3', 3, 'noun'),
('经济', '経済', 'けいざい', 'N3', 3, 'noun');

-- N2 中高级单词
INSERT INTO vocabulary (chinese, original, kana, category, difficulty, word_class) VALUES
-- 高级动词
('调查', '調べる', 'しらべる', 'N2', 4, 'verb'),
('讨论', '議論する', 'ぎろんする', 'N2', 4, 'verb'),
('决定', '決める', 'きめる', 'N2', 4, 'verb'),
('改变', '変える', 'かえる', 'N2', 4, 'verb'),
('增加', '増える', 'ふえる', 'N2', 4, 'verb'),
('减少', '減る', 'へる', 'N2', 4, 'verb'),
('发展', '発展する', 'はってんする', 'N2', 4, 'verb'),
('实现', '実現する', 'じつげんする', 'N2', 4, 'verb'),

-- 专业词汇
('技术', '技術', 'ぎじゅつ', 'N2', 4, 'noun'),
('研究', '研究', 'けんきゅう', 'N2', 4, 'noun'),
('开发', '開発', 'かいはつ', 'N2', 4, 'noun'),
('管理', '管理', 'かんり', 'N2', 4, 'noun'),
('效率', '効率', 'こうりつ', 'N2', 4, 'noun'),
('质量', '品質', 'ひんしつ', 'N2', 4, 'noun'),
('环境', '環境', 'かんきょう', 'N2', 4, 'noun'),
('资源', '資源', 'しげん', 'N2', 4, 'noun');

-- N1 高级单词
INSERT INTO vocabulary (chinese, original, kana, category, difficulty, word_class) VALUES
-- 高级词汇
('照旧；仍然', '相変わらず', 'あいかわらず', 'N1', 5, 'adverb'),
('显著', '著しい', 'いちじるしい', 'N1', 5, 'adjective'),
('暧昧', '曖昧', 'あいまい', 'N1', 5, 'noun'),
('明确', '明確', 'めいかく', 'N1', 5, 'noun'),
('抽象', '抽象', 'ちゅうしょう', 'N1', 5, 'noun'),
('具体', '具体', 'ぐたい', 'N1', 5, 'noun'),
('普遍', '普遍', 'ふへん', 'N1', 5, 'noun'),
('特殊', '特殊', 'とくしゅ', 'N1', 5, 'noun'),
('本质', '本質', 'ほんしつ', 'N1', 5, 'noun'),
('现象', '現象', 'げんしょう', 'N1', 5, 'noun'),

-- 学术词汇
('假设', '仮説', 'かせつ', 'N1', 5, 'noun'),
('理论', '理論', 'りろん', 'N1', 5, 'noun'),
('概念', '概念', 'がいねん', 'N1', 5, 'noun'),
('原则', '原則', 'げんそく', 'N1', 5, 'noun'),
('基准', '基準', 'きじゅん', 'N1', 5, 'noun'),
('标准', '標準', 'ひょうじゅん', 'N1', 5, 'noun'),
('客观', '客観', 'きゃっかん', 'N1', 5, 'noun'),
('主观', '主観', 'しゅかん', 'N1', 5, 'noun');

-- 计算机术语（专业分类示例）
INSERT INTO vocabulary (chinese, original, kana, category, difficulty, word_class) VALUES
('电脑', 'コンピューター', 'こんぴゅーたー', '计算机', 2, 'noun'),
('软件', 'ソフトウェア', 'そふとうぇあ', '计算机', 2, 'noun'),
('硬件', 'ハードウェア', 'はーどうぇあ', '计算机', 2, 'noun'),
('网络', 'ネットワーク', 'ねっとわーく', '计算机', 2, 'noun'),
('服务器', 'サーバー', 'さーばー', '计算机', 2, 'noun'),
('数据库', 'データベース', 'でーたべーす', '计算机', 2, 'noun'),
('程序', 'プログラム', 'ぷろぐらむ', '计算机', 2, 'noun'),
('算法', 'アルゴリズム', 'あるごりずむ', '计算机', 3, 'noun'),
('编程', 'プログラミング', 'ぷろぐらみんぐ', '计算机', 3, 'noun'),
('代码', 'コード', 'こーど', '计算机', 2, 'noun'),
('调试', 'デバッグ', 'でばっぐ', '计算机', 3, 'verb'),
('测试', 'テスト', 'てすと', '计算机', 2, 'verb');

-- 金融术语（专业分类示例）
INSERT INTO vocabulary (chinese, original, kana, category, difficulty, word_class) VALUES
('银行', '銀行', 'ぎんこう', '金融', 2, 'noun'),
('存款', '預金', 'よきん', '金融', 2, 'noun'),
('贷款', 'ローン', 'ろーん', '金融', 2, 'noun'),
('利息', '利子', 'りし', '金融', 3, 'noun'),
('股票', '株', 'かぶ', '金融', 3, 'noun'),
('投资', '投資', 'とうし', '金融', 3, 'noun'),
('证券', '証券', 'しょうけん', '金融', 3, 'noun'),
('汇率', '為替レート', 'かわせれーと', '金融', 3, 'noun'),
('保险', '保険', 'ほけん', '金融', 2, 'noun'),
('税金', '税金', 'ぜいきん', '金融', 2, 'noun');

-- ========================================
-- 插入用户数据
-- ========================================
INSERT INTO users (username, email) VALUES
('admin', 'admin@example.com'),
('test_user', 'test@example.com'),
('student1', 'student1@example.com'),
('student2', 'student2@example.com');

-- ========================================
-- 插入练习记录（模拟学习历史）
-- ========================================
-- 用户1的练习记录
INSERT INTO practice_records (user_id, vocabulary_id, user_answer, is_correct, practice_date) VALUES
-- 最近的练习（今天）
(1, 1, 'あいかわらず', true, CURRENT_DATE),
(1, 2, 'こんにちは', true, CURRENT_DATE),
(1, 3, 'あがりとう', false, CURRENT_DATE),  -- 拼写错误
(1, 4, 'さようなら', true, CURRENT_DATE),

-- 昨天的练习
(1, 5, 'すみません', true, CURRENT_DATE - INTERVAL '1 day'),
(1, 6, 'おはよう', true, CURRENT_DATE - INTERVAL '1 day'),
(1, 7, 'こんばんわ', false, CURRENT_DATE - INTERVAL '1 day'),  -- 假名错误

-- 前天的练习
(1, 8, 'はい', true, CURRENT_DATE - INTERVAL '2 days'),
(1, 9, 'いいえ', true, CURRENT_DATE - INTERVAL '2 days'),
(1, 10, 'どうぞ', true, CURRENT_DATE - INTERVAL '2 days'),

-- 一周前的练习
(1, 11, 'なに', true, CURRENT_DATE - INTERVAL '7 days'),
(1, 12, 'だれ', true, CURRENT_DATE - INTERVAL '7 days'),
(1, 13, 'どこ', false, CURRENT_DATE - INTERVAL '7 days');

-- 用户2的练习记录
INSERT INTO practice_records (user_id, vocabulary_id, user_answer, is_correct, practice_date) VALUES
(2, 1, 'あいかわらず', true, CURRENT_DATE),
(2, 2, 'こんにちは', true, CURRENT_DATE),
(2, 11, 'なに', true, CURRENT_DATE - INTERVAL '1 day'),
(2, 12, 'だれ', false, CURRENT_DATE - INTERVAL '1 day');

-- ========================================
-- 插入不熟悉单词记录
-- ========================================
INSERT INTO unfamiliar_words (user_id, vocabulary_id, unfamiliar_type) VALUES
-- 用户1标记的不熟悉单词
(1, 3, 'kana'),      -- ありがとう - 假名记不住
(1, 7, 'kana'),      -- こんばんは - 假名容易错
(1, 13, 'kana'),     -- どこ - 练习时答错了
(1, 20, 'original'), -- 万 - 汉字不会写
(1, 35, 'original'), -- 彼/彼女 - 汉字复杂

-- 用户2标记的不熟悉单词
(2, 12, 'kana'),     -- だれ
(2, 15, 'original'); -- どうして

-- ========================================
-- 插入单词集合
-- ========================================
INSERT INTO vocabulary_sets (name, description, is_public, created_by) VALUES
('每日必学50词', '适合初学者的每日学习计划', true, 1),
('N5考试必备', 'JLPT N5考试高频词汇', true, 1),
('N4考试必备', 'JLPT N4考试高频词汇', true, 1),
('常用动词合集', '日常生活中最常用的100个动词', true, 1),
('计算机专业词汇', 'IT从业者必备日语术语', true, 1),
('我的收藏', '个人收藏的重点单词', false, 2);

-- ========================================
-- 插入单词集合关联（将单词加入集合）
-- ========================================
-- 每日必学50词（N5基础单词）
INSERT INTO vocabulary_set_items (set_id, vocabulary_id, sort_order)
SELECT 1, id, ROW_NUMBER() OVER (ORDER BY id)
FROM vocabulary
WHERE category = 'N5'
LIMIT 50;

-- N5考试必备（所有N5单词）
INSERT INTO vocabulary_set_items (set_id, vocabulary_id, sort_order)
SELECT 2, id, ROW_NUMBER() OVER (ORDER BY id)
FROM vocabulary
WHERE category = 'N5';

-- N4考试必备（所有N4单词）
INSERT INTO vocabulary_set_items (set_id, vocabulary_id, sort_order)
SELECT 3, id, ROW_NUMBER() OVER (ORDER BY id)
FROM vocabulary
WHERE category = 'N4';

-- 常用动词合集（包含N4和N3的动词）
INSERT INTO vocabulary_set_items (set_id, vocabulary_id, sort_order)
SELECT 4, id, ROW_NUMBER() OVER (ORDER BY id)
FROM vocabulary
WHERE category IN ('N4', 'N3') 
  AND (chinese LIKE '%做%' OR chinese LIKE '%去%' OR chinese LIKE '%来%' 
       OR chinese LIKE '%吃%' OR chinese LIKE '%喝%' OR chinese LIKE '%看%'
       OR chinese LIKE '%学%' OR chinese LIKE '%工作%' OR chinese LIKE '%教%')
LIMIT 30;

-- 计算机专业词汇（所有计算机分类的单词）
INSERT INTO vocabulary_set_items (set_id, vocabulary_id, sort_order)
SELECT 5, id, ROW_NUMBER() OVER (ORDER BY id)
FROM vocabulary
WHERE category = '计算机';

-- 用户2的收藏（用户2标记为不熟悉的单词）
INSERT INTO vocabulary_set_items (set_id, vocabulary_id, sort_order)
SELECT 6, vocabulary_id, ROW_NUMBER() OVER (ORDER BY vocabulary_id)
FROM unfamiliar_words
WHERE user_id = 2;

-- ========================================
-- 查看插入结果统计
-- ========================================

SELECT '=== 单词统计 ===' as info;
SELECT 
    category,
    COUNT(*) as word_count,
    ROUND(AVG(difficulty), 1) as avg_difficulty
FROM vocabulary
GROUP BY category
ORDER BY 
    CASE 
        WHEN category = 'N5' THEN 1
        WHEN category = 'N4' THEN 2
        WHEN category = 'N3' THEN 3
        WHEN category = 'N2' THEN 4
        WHEN category = 'N1' THEN 5
        ELSE 6
    END;

SELECT '=== 用户统计 ===' as info;
SELECT 
    u.username,
    COUNT(DISTINCT pr.id) as practice_count,
    COUNT(DISTINCT CASE WHEN pr.is_correct THEN pr.id END) as correct_count,
    COUNT(DISTINCT uw.id) as unfamiliar_count
FROM users u
LEFT JOIN practice_records pr ON u.id = pr.user_id
LEFT JOIN unfamiliar_words uw ON u.id = uw.user_id
GROUP BY u.id, u.username
ORDER BY u.id;

SELECT '=== 单词集合统计 ===' as info;
SELECT 
    vs.name,
    vs.is_public,
    u.username as creator,
    COUNT(vsi.vocabulary_id) as word_count
FROM vocabulary_sets vs
LEFT JOIN users u ON vs.created_by = u.id
LEFT JOIN vocabulary_set_items vsi ON vs.id = vsi.set_id
GROUP BY vs.id, vs.name, vs.is_public, u.username
ORDER BY vs.id;

SELECT '=== 练习记录按日期统计 ===' as info;
SELECT 
    practice_date,
    COUNT(*) as total_practices,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
    ROUND(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0 END), 1) as accuracy_rate
FROM practice_records
GROUP BY practice_date
ORDER BY practice_date DESC
LIMIT 10;

SELECT '=== 数据插入完成！===' as info;
