import { Router } from 'express';
import * as diaryController from '../controllers/diary.controller.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.get('/calendar', diaryController.calendar);
router.get('/', diaryController.list);
router.post('/', diaryController.create);
router.get('/:id', diaryController.get);
router.put('/:id', diaryController.update);
router.delete('/:id', diaryController.remove);
router.post(
  '/:id/images',
  upload.array('images', 10),
  diaryController.uploadImages
);

export default router;
