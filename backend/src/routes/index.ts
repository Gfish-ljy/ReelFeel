import { Router } from 'express';
import authRoutes from './auth.routes.js';
import diaryRoutes from './diary.routes.js';
import categoryRoutes from './category.routes.js';
import tagRoutes from './tag.routes.js';
import collectionRoutes from './collection.routes.js';
import exportRoutes from './export.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/diaries', diaryRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/collections', collectionRoutes);
router.use('/export', exportRoutes);

router.get('/health', (_req, res) => {
  res.json({ code: 200, data: { status: 'ok' }, message: 'success' });
});

export default router;
