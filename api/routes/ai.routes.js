import express from 'express';
import { generateExamples } from '../controllers/ai.controller.js';

const router = express.Router();

// 生成例句
router.post('/generate-examples', generateExamples);

export default router;
