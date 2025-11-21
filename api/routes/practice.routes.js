/**
 * 练习记录相关路由
 */
import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as practiceController from '../controllers/practice.controller.js';

const router = express.Router();

// 记录练习结果（会自动触发复习计划更新）
router.post('/', asyncHandler(practiceController.recordPractice));

export default router;
