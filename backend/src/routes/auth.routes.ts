import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// OAuth2 第三方登录占位（待后续迭代）
router.get('/oauth/:provider', (_req, res) => {
  res.status(501).json({
    code: 501,
    data: null,
    message: 'OAuth2 登录待后续迭代，请使用邮箱密码登录',
  });
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/password', authenticate, authController.changePassword);
router.post(
  '/avatar',
  authenticate,
  authController.uploadAvatarMiddleware,
  authController.uploadAvatar
);

export default router;
