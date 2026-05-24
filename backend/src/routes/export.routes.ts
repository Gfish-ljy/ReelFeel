import { Router } from 'express';
import * as exportController from '../controllers/export.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/data', exportController.exportData);
router.get('/info', exportController.exportMeta);

export default router;
