import { Router } from 'express';
import * as collectionController from '../controllers/collection.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', collectionController.list);
router.post('/', collectionController.create);
router.get('/:id', collectionController.get);
router.put('/:id', collectionController.update);
router.delete('/:id', collectionController.remove);
router.post('/:id/items', collectionController.addItem);
router.put('/:id/items/reorder', collectionController.reorder);
router.delete('/:id/items/:diaryId', collectionController.removeItem);

export default router;
