import { Router } from 'express';
import * as tagController from '../controllers/tag.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', tagController.list);
router.post('/', tagController.create);
router.delete('/:id', tagController.remove);

export default router;
