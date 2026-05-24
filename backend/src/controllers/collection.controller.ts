import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as collectionService from '../services/collection.service.js';
import { success } from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await collectionService.listCollections(req.user!.userId);
    return success(res, data);
  } catch (e) {
    next(e);
  }
}

export async function get(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await collectionService.getCollection(req.user!.userId, req.params.id);
    return success(res, data);
  } catch (e) {
    next(e);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = z.object({
      name: z.string().min(1).max(200),
      description: z.string().optional(),
      coverImageUrl: z.string().url().optional(),
    }).parse(req.body);
    const data = await collectionService.createCollection(req.user!.userId, body);
    return success(res, data, '创建成功', 201);
  } catch (e) {
    next(e);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = z.object({
      name: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      coverImageUrl: z.string().url().optional(),
    }).parse(req.body);
    const data = await collectionService.updateCollection(
      req.user!.userId,
      req.params.id,
      body
    );
    return success(res, data);
  } catch (e) {
    next(e);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await collectionService.deleteCollection(req.user!.userId, req.params.id);
    return success(res, null, '已删除');
  } catch (e) {
    next(e);
  }
}

export async function addItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = z.object({
      diaryId: z.string().uuid(),
      sortOrder: z.number().optional(),
    }).parse(req.body);
    const data = await collectionService.addCollectionItem(
      req.user!.userId,
      req.params.id,
      body.diaryId,
      body.sortOrder
    );
    return success(res, data, '已添加', 201);
  } catch (e) {
    next(e);
  }
}

export async function removeItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const diaryId = z.string().uuid().parse(req.params.diaryId);
    const data = await collectionService.removeCollectionItem(
      req.user!.userId,
      req.params.id,
      diaryId
    );
    return success(res, data);
  } catch (e) {
    next(e);
  }
}

export async function reorder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = z.object({
      items: z.array(z.object({
        diaryId: z.string().uuid(),
        sortOrder: z.number(),
      })),
    }).parse(req.body);
    const data = await collectionService.reorderCollectionItems(
      req.user!.userId,
      req.params.id,
      body.items
    );
    return success(res, data);
  } catch (e) {
    next(e);
  }
}
