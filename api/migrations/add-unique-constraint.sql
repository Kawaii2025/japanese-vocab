-- 为 vocabulary 表添加唯一约束，防止重复添加相同的单词
-- 唯一性由 chinese + kana 组合决定

-- 1. 首先删除可能已存在的重复数据（保留最早添加的）
DELETE FROM vocabulary a USING vocabulary b
WHERE a.id > b.id 
  AND a.chinese = b.chinese 
  AND a.kana = b.kana;

-- 2. 添加唯一约束
ALTER TABLE vocabulary 
ADD CONSTRAINT vocabulary_chinese_kana_unique 
UNIQUE (chinese, kana);

-- 3. 验证约束是否创建成功
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'vocabulary' 
  AND tc.constraint_type = 'UNIQUE';
