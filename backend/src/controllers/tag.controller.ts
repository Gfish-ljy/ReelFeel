import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as tagService from '../services/tag.service.js';
import { success } from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await tagService.listTags(req.user!.userId);
    return success(res, data);
  } catch (e) {
    next(e);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = z.object({ name: z.string().min(1).max(100) }).parse(req.body);
    const data = await tagService.createTag(req.user!.userId, body.name);
    return success(res, data, '创建成功', 201);
  } catch (e) {
    next(e);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await tagService.deleteTag(req.user!.userId, req.params.id);
    return success(res, null, '已删除');
  } catch (e) {
    next(e);
  }
}
