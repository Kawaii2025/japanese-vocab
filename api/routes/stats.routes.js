/**
 * 统计相关路由
 */
import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as statsController from '../controllers/stats.controller.js';

const router = express.Router();

// 获取每日录入统计
router.get('/daily-input', asyncHandler(statsController.getDailyInputStats));

// 获取每日练习统计
router.get('/daily-practice', asyncHandler(statsController.getDailyPracticeStats));

// 获取掌握程度分布
router.get('/mastery-distribution', asyncHandler(statsController.getMasteryDistribution));

// 获取学习概览
router.get('/overview', asyncHandler(statsController.getOverview));

export default router;
