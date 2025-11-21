/**
 * 单词相关路由
 */
import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as vocabularyController from '../controllers/vocabulary.controller.js';

const router = express.Router();

// ==================== 特殊路由（必须在动态路由之前） ====================

// 随机获取单词（用于练习）
router.get('/random/:count', asyncHandler(vocabularyController.getRandomVocabulary));

// 搜索单词（带分页）
router.get('/search/:keyword', asyncHandler(vocabularyController.searchVocabulary));

// 获取所有分类
router.get('/categories/list', asyncHandler(vocabularyController.getAllCategories));

// 获取今日录入的单词
router.get('/today/list', asyncHandler(vocabularyController.getTodayVocabulary));

// 获取指定日期的单词
router.get('/by-date/:date', asyncHandler(vocabularyController.getVocabularyByDate));

// 获取日期范围内的单词
router.get('/date-range/query', asyncHandler(vocabularyController.getVocabularyByDateRange));

// 获取今日待复习的单词
router.get('/review/today', asyncHandler(vocabularyController.getTodayReview));

// 获取未来N天的复习计划
router.get('/review/plan', asyncHandler(vocabularyController.getReviewPlan));

// ==================== CRUD 操作 ====================

// 获取所有单词（带分页，默认第一页）
router.get('/', asyncHandler(vocabularyController.getAllVocabulary));

// 获取单个单词（放在最后，避免匹配其他路径）
router.get('/:id', asyncHandler(vocabularyController.getVocabularyById));

// 创建单词
router.post('/', asyncHandler(vocabularyController.createVocabulary));

// 批量创建单词
router.post('/batch', asyncHandler(vocabularyController.batchCreateVocabulary));

// 更新单词
router.put('/:id', asyncHandler(vocabularyController.updateVocabulary));

// 删除单词
router.delete('/:id', asyncHandler(vocabularyController.deleteVocabulary));

// ==================== 不熟悉单词管理 ====================

// 获取不熟悉单词列表
router.get('/unfamiliar/list', asyncHandler(vocabularyController.getUnfamiliarWords));

// 标记单词为不熟悉
router.post('/:id/unfamiliar', asyncHandler(vocabularyController.markAsUnfamiliar));

// 移除不熟悉标记
router.delete('/:id/unfamiliar', asyncHandler(vocabularyController.removeUnfamiliarMark));

export default router;
