import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as categoryService from '../services/category.service.js';
import { success } from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await categoryService.listCategories(req.user!.userId);
    return success(res, data);
  } catch (e) {
    next(e);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = z.object({
      name: z.string().min(1).max(100),
      color: z.string().optional(),
    }).parse(req.body);
    const data = await categoryService.createCategory(req.user!.userId, body.name, body.color);
    return success(res, data, '创建成功', 201);
  } catch (e) {
    next(e);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = z.object({
      name: z.string().min(1).max(100).optional(),
      color: z.string().optional(),
      sortOrder: z.number().optional(),
    }).parse(req.body);
    const data = await categoryService.updateCategory(req.user!.userId, req.params.id, body);
    return success(res, data);
  } catch (e) {
    next(e);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await categoryService.deleteCategory(req.user!.userId, req.params.id);
    return success(res, null, '已删除');
  } catch (e) {
    next(e);
  }
}
