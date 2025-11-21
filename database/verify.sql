-- ========================================
-- 数据库验证脚本
-- 运行此文件来检查 schema.sql 是否正确执行
-- ========================================

-- 1. 检查所有表是否创建成功
-- 预期结果：应该看到 6 个表
-- practice_records, unfamiliar_words, users, vocabulary, vocabulary_set_items, vocabulary_sets
SELECT '1. 检查所有表' as check_name;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. 检查 vocabulary 表结构（核心表）
-- 预期字段：id, chinese, original, kana, category, difficulty
-- input_date, next_review_date, review_count, mastery_level, created_at, updated_at
SELECT '2. 检查 vocabulary 表结构' as check_name;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vocabulary' 
ORDER BY ordinal_position;

-- 3. 检查索引是否创建
-- 预期包含：idx_vocabulary_category, idx_vocabulary_input_date, idx_vocabulary_review_date
SELECT '3. 检查索引' as check_name;
SELECT 
    indexname, 
    tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- 4. 检查函数是否创建
-- 预期包含：calculate_next_review_date, update_vocabulary_after_practice, update_updated_at_column
SELECT '4. 检查函数' as check_name;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 5. 检查触发器是否创建
-- 预期包含：trigger_update_vocabulary_after_practice, update_vocabulary_updated_at, update_vocabulary_sets_updated_at
SELECT '5. 检查触发器' as check_name;
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- 6. 检查示例数据
-- 预期结果：应该有 10 条示例数据
SELECT '6. 检查示例数据数量' as check_name;
SELECT COUNT(*) as total_words FROM vocabulary;

SELECT '6. 查看示例数据详情' as check_name;
SELECT id, chinese, kana, category, input_date, next_review_date, mastery_level 
FROM vocabulary 
ORDER BY id;

-- 7. 快速统计总览
-- 预期结果：Tables: 6, Vocabulary records: 10, Functions: 3, Indexes: 10+, Triggers: 3
SELECT '7. 快速统计总览' as check_name;
SELECT 
    'Tables' as check_type, 
    COUNT(*)::text as count
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 
    'Vocabulary records', 
    COUNT(*)::text
FROM vocabulary
UNION ALL
SELECT 
    'Functions', 
    COUNT(*)::text
FROM information_schema.routines 
WHERE routine_schema = 'public'
UNION ALL
SELECT 
    'Indexes', 
    COUNT(*)::text
FROM pg_indexes 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Triggers',
    COUNT(*)::text
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- ========================================
-- 8. 测试复习功能（可选）
-- 如果需要测试，请依次运行以下 SQL：
-- ========================================

-- 插入测试用户
-- INSERT INTO users (username, email) VALUES ('test_user', 'test@example.com');

-- 记录一次练习（答对）- 会自动触发复习计划更新
-- INSERT INTO practice_records (user_id, vocabulary_id, user_answer, is_correct)
-- VALUES (1, 1, 'あいかわらず', true);

-- 检查单词是否自动更新（预期：mastery_level 从 0 变成 1，next_review_date 为明天）
-- SELECT id, chinese, mastery_level, review_count, next_review_date
-- FROM vocabulary WHERE id = 1;

-- ========================================
-- 验证完成！
-- 如果所有结果符合预期，说明数据库建表成功！✅
-- ========================================
