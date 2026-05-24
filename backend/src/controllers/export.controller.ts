import type { Response, NextFunction } from 'express';
import * as exportService from '../services/export.service.js';
import { success } from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';

export async function exportData(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const format = (req.query.format as string) || 'json';
    const data = await exportService.exportUserData(req.user!.userId);

    if (format === 'markdown') {
      const md = exportService.toMarkdown(data);
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="anidiary-export.md"');
      return res.send(md);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="anidiary-export.json"');
    return res.json({ code: 200, data, message: 'success' });
  } catch (e) {
    next(e);
  }
}

export async function exportMeta(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    return success(res, {
      formats: ['json', 'markdown'],
      notice: 'AI 功能已剥离，导出数据仅包含用户手动创建的内容',
    });
  } catch (e) {
    next(e);
  }
}
