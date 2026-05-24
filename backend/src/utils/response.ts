import type { Response } from 'express';

export function success<T>(res: Response, data: T, message = 'success', code = 200) {
  return res.status(code).json({ code, data, message });
}

export function fail(res: Response, message: string, code = 400) {
  return res.status(code).json({ code, data: null, message });
}
