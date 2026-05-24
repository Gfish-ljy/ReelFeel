import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service.js';
import { success, fail } from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nickname: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function register(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = registerSchema.parse(req.body);
    const user = await authService.register(body.email, body.password, body.nickname);
    const tokens = await authService.issueTokens({ id: user.id, email: user.email });
    return success(res, tokens, '注册成功', 201);
  } catch (e) {
    next(e);
  }
}

export async function login(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.parse(req.body);
    const tokens = await authService.login(body.email, body.password);
    return success(res, tokens);
  } catch (e) {
    next(e);
  }
}

export async function refresh(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    const tokens = await authService.refresh(refreshToken);
    return success(res, tokens);
  } catch (e) {
    next(e);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (req.user) await authService.logout(req.user.userId);
    return success(res, null);
  } catch (e) {
    next(e);
  }
}

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await authService.getProfile(req.user!.userId);
    return success(res, profile);
  } catch (e) {
    next(e);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = z.object({
      nickname: z.string().min(1).max(100).optional(),
      avatarUrl: z.string().url().optional(),
    }).parse(req.body);
    const profile = await authService.updateProfile(req.user!.userId, {
      nickname: body.nickname,
      avatarUrl: body.avatarUrl,
    });
    return success(res, profile);
  } catch (e) {
    next(e);
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = z.object({
      oldPassword: z.string(),
      newPassword: z.string().min(8),
    }).parse(req.body);
    await authService.changePassword(req.user!.userId, body.oldPassword, body.newPassword);
    return success(res, null, '密码已更新');
  } catch (e) {
    next(e);
  }
}

export const uploadAvatarMiddleware = upload.single('avatar');

export async function uploadAvatar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) return fail(res, '请上传头像文件');
    const profile = await authService.uploadAvatar(
      req.user!.userId,
      req.file.buffer,
      req.file.mimetype
    );
    return success(res, profile);
  } catch (e) {
    next(e);
  }
}
