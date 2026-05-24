import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { fail } from '../utils/response.js';
import { getErrorMessage } from '../utils/errorMessage.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return fail(res, err.errors.map((e) => e.message).join('; '), 400);
  }
  const message = getErrorMessage(err);
  if (err instanceof Error && /不存在/.test(message)) {
    return fail(res, message, 404);
  }
  if (err instanceof Error && message !== '服务器内部错误') {
    const status = /数据库|PostgreSQL|未连接|未初始化/.test(message) ? 503 : 400;
    return fail(res, message, status);
  }
  console.error(err);
  return fail(res, message, 500);
}
