import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as diaryService from '../services/diary.service.js';
import { success } from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const data = await diaryService.listDiaries({
      userId,
      page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
      limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 20,
      category: req.query.category as string | undefined,
      tag: req.query.tag as string | undefined,
      keyword: req.query.keyword as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    });
    return success(res, data);
  } catch (e) {
    next(e);
  }
}

export async function calendar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const year = parseInt(String(req.query.year), 10);
    const month = parseInt(String(req.query.month), 10);
    const data = await diaryService.getDiariesByDateRange(req.user!.userId, year, month);
    return success(res, data);
  } catch (e) {
    next(e);
  }
}

export async function get(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await diaryService.getDiary(req.user!.userId, req.params.id);
    return success(res, data);
  } catch (e) {
    next(e);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = z.object({
      title: z.string().max(500),
      content: z.string(),
      mood: z.string().optional(),
      categoryIds: z.array(z.string().uuid()).optional(),
      tagIds: z.array(z.string().uuid()).optional(),
    }).parse(req.body);
    const data = await diaryService.createDiary(req.user!.userId, body);
    return success(res, data, '创建成功', 201);
  } catch (e) {
    next(e);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = z.object({
      title: z.string().max(500).optional(),
      content: z.string().optional(),
      mood: z.string().optional(),
      categoryIds: z.array(z.string().uuid()).optional(),
      tagIds: z.array(z.string().uuid()).optional(),
    }).parse(req.body);
    const data = await diaryService.updateDiary(req.user!.userId, req.params.id, body);
    return success(res, data);
  } catch (e) {
    next(e);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await diaryService.deleteDiary(req.user!.userId, req.params.id);
    return success(res, null, '已删除');
  } catch (e) {
    next(e);
  }
}

export async function uploadImages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const files = req.files as Express.Multer.File[];
    const data = await diaryService.uploadDiaryImages(
      req.user!.userId,
      req.params.id,
      files || []
    );
    return success(res, data, '上传成功', 201);
  } catch (e) {
    next(e);
  }
}
