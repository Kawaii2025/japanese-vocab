import express from 'express';
import { generateExamples, generateExamplesStream } from '../controllers/ai.controller.js';

const router = express.Router();

// 生成例句 (非流式)
router.post('/generate-examples', generateExamples);

// 生成例句 (流式 SSE)
router.post('/generate-examples/stream', generateExamplesStream);

export default router;
