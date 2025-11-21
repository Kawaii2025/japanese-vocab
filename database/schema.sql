-- 日语单词记忆练习数据库设计
-- 数据库: PostgreSQL (Neon)

-- 1. 单词表 (vocabulary)
CREATE TABLE vocabulary (
    id SERIAL PRIMARY KEY,
    chinese VARCHAR(255) NOT NULL,           -- 中文意思
    original VARCHAR(255),                   -- 日语原文（可选）
    kana VARCHAR(255) NOT NULL,              -- 纯假名
    category VARCHAR(100),                   -- 分类（如：基础、进阶等）
    difficulty INTEGER DEFAULT 1,            -- 难度等级 1-5
    input_date DATE DEFAULT CURRENT_DATE,    -- 录入日期（用于按日期检索）
    next_review_date DATE,                   -- 下次复习日期（基于艾宾浩斯遗忘曲线）
    review_count INTEGER DEFAULT 0,          -- 复习次数
    mastery_level INTEGER DEFAULT 0,         -- 掌握程度 0-5（影响复习间隔）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 用户表 (users) - 如果需要多用户支持
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 练习记录表 (practice_records)
CREATE TABLE practice_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id INTEGER REFERENCES vocabulary(id) ON DELETE CASCADE,
    user_answer VARCHAR(255),                -- 用户的答案
    is_correct BOOLEAN NOT NULL,             -- 是否正确
    attempt_count INTEGER DEFAULT 1,         -- 尝试次数
    practice_date DATE DEFAULT CURRENT_DATE, -- 练习日期（用于按日期统计）
    practiced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 不熟悉单词记录表 (unfamiliar_words)
CREATE TABLE unfamiliar_words (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id INTEGER REFERENCES vocabulary(id) ON DELETE CASCADE,
    unfamiliar_type VARCHAR(50) NOT NULL,    -- 'original' 或 'kana'
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, vocabulary_id, unfamiliar_type)
);

-- 5. 单词集合表 (vocabulary_sets) - 用于组织单词
CREATE TABLE vocabulary_sets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 单词集合关联表 (vocabulary_set_items)
CREATE TABLE vocabulary_set_items (
    id SERIAL PRIMARY KEY,
    set_id INTEGER REFERENCES vocabulary_sets(id) ON DELETE CASCADE,
    vocabulary_id INTEGER REFERENCES vocabulary(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(set_id, vocabulary_id)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_vocabulary_kana ON vocabulary(kana);
CREATE INDEX idx_vocabulary_category ON vocabulary(category);
CREATE INDEX idx_vocabulary_input_date ON vocabulary(input_date);          -- 按录入日期检索
CREATE INDEX idx_vocabulary_review_date ON vocabulary(next_review_date);   -- 按复习日期检索
CREATE INDEX idx_practice_records_user ON practice_records(user_id);
CREATE INDEX idx_practice_records_vocab ON practice_records(vocabulary_id);
CREATE INDEX idx_practice_records_date ON practice_records(practice_date); -- 按练习日期统计
CREATE INDEX idx_unfamiliar_words_user ON unfamiliar_words(user_id);
CREATE INDEX idx_vocabulary_set_items_set ON vocabulary_set_items(set_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vocabulary_updated_at BEFORE UPDATE ON vocabulary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vocabulary_sets_updated_at BEFORE UPDATE ON vocabulary_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据
INSERT INTO vocabulary (chinese, original, kana, category, difficulty) VALUES
('照旧；仍然', '相変わらず', 'あいかわらず', '基础', 2),
('你好', 'こんにちは', 'こんにちは', '基础', 1),
('谢谢', 'ありがとう', 'ありがとう', '基础', 1),
('再见', 'さようなら', 'さようなら', '基础', 1),
('对不起', 'すみません', 'すみません', '基础', 1),
('早上好', 'おはよう', 'おはよう', '基础', 1),
('晚上好', 'こんばんは', 'こんばんは', '基础', 1),
('是的', 'はい', 'はい', '基础', 1),
('不是', 'いいえ', 'いいえ', '基础', 1),
('请', 'ください', 'ください', '基础', 1);

-- 查看表结构
-- \d vocabulary
-- \d practice_records
-- \d unfamiliar_words
-- \d vocabulary_sets

-- 常用查询示例

-- 1. 获取所有单词
SELECT * FROM vocabulary ORDER BY id;

-- 2. 按分类获取单词
SELECT * FROM vocabulary WHERE category = '基础' ORDER BY difficulty;

-- 3. 获取用户的练习统计
SELECT 
    COUNT(*) as total_practiced,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
    ROUND(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0 END), 2) as accuracy_rate
FROM practice_records
WHERE user_id = 1;

-- 4. 获取用户的错题
SELECT 
    v.chinese, v.original, v.kana, 
    pr.user_answer, pr.practiced_at
FROM practice_records pr
JOIN vocabulary v ON pr.vocabulary_id = v.id
WHERE pr.user_id = 1 AND pr.is_correct = false
ORDER BY pr.practiced_at DESC;

-- 5. 获取用户标记的不熟悉单词
SELECT 
    v.chinese, v.original, v.kana,
    uw.unfamiliar_type
FROM unfamiliar_words uw
JOIN vocabulary v ON uw.vocabulary_id = v.id
WHERE uw.user_id = 1;

-- 6. 获取单词集合及其单词
SELECT 
    vs.name as set_name,
    v.chinese, v.original, v.kana
FROM vocabulary_sets vs
JOIN vocabulary_set_items vsi ON vs.id = vsi.set_id
JOIN vocabulary v ON vsi.vocabulary_id = v.id
WHERE vs.id = 1
ORDER BY vsi.sort_order;

-- 7. 按录入日期检索单词（今日录入）
SELECT * FROM vocabulary 
WHERE input_date = CURRENT_DATE
ORDER BY created_at DESC;

-- 8. 按日期范围检索单词（本周录入）
SELECT * FROM vocabulary 
WHERE input_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY input_date DESC, created_at DESC;

-- 9. 获取今日需要复习的单词
SELECT * FROM vocabulary 
WHERE next_review_date <= CURRENT_DATE
ORDER BY next_review_date ASC, mastery_level ASC;

-- 10. 获取某个日期录入的单词
SELECT * FROM vocabulary 
WHERE input_date = '2025-11-22'
ORDER BY created_at DESC;

-- 11. 按日期统计每日录入数量
SELECT 
    input_date,
    COUNT(*) as word_count,
    COUNT(CASE WHEN mastery_level >= 3 THEN 1 END) as mastered_count
FROM vocabulary
WHERE input_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY input_date
ORDER BY input_date DESC;

-- 12. 按日期统计每日练习情况
SELECT 
    practice_date,
    COUNT(*) as practice_count,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
    ROUND(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0 END), 2) as accuracy_rate
FROM practice_records
WHERE user_id = 1 AND practice_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY practice_date
ORDER BY practice_date DESC;

-- 13. 艾宾浩斯复习计划（根据掌握程度设置下次复习日期）
-- 掌握程度 0: 第1天复习
-- 掌握程度 1: 第2天复习
-- 掌握程度 2: 第4天复习
-- 掌握程度 3: 第7天复习
-- 掌握程度 4: 第15天复习
-- 掌握程度 5: 第30天复习
CREATE OR REPLACE FUNCTION calculate_next_review_date(current_mastery INTEGER)
RETURNS DATE AS $$
BEGIN
    RETURN CURRENT_DATE + 
        CASE current_mastery
            WHEN 0 THEN INTERVAL '1 day'
            WHEN 1 THEN INTERVAL '2 days'
            WHEN 2 THEN INTERVAL '4 days'
            WHEN 3 THEN INTERVAL '7 days'
            WHEN 4 THEN INTERVAL '15 days'
            ELSE INTERVAL '30 days'
        END;
END;
$$ LANGUAGE plpgsql;

-- 14. 练习成功后自动更新复习日期和掌握程度的触发器
CREATE OR REPLACE FUNCTION update_vocabulary_after_practice()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_correct THEN
        -- 答对了，提升掌握程度，设置下次复习日期
        UPDATE vocabulary 
        SET 
            review_count = review_count + 1,
            mastery_level = LEAST(mastery_level + 1, 5),
            next_review_date = calculate_next_review_date(LEAST(mastery_level + 1, 5)),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.vocabulary_id;
    ELSE
        -- 答错了，降低掌握程度，缩短复习间隔
        UPDATE vocabulary 
        SET 
            review_count = review_count + 1,
            mastery_level = GREATEST(mastery_level - 1, 0),
            next_review_date = calculate_next_review_date(GREATEST(mastery_level - 1, 0)),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.vocabulary_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vocabulary_after_practice
AFTER INSERT ON practice_records
FOR EACH ROW EXECUTE FUNCTION update_vocabulary_after_practice();
