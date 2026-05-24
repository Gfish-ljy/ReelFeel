import { query } from '../config/database.js';
import * as diaryService from './diary.service.js';

export async function exportUserData(userId: string) {
  const [user, categories, tags, collections] = await Promise.all([
    query('SELECT id, email, nickname, avatar_url, created_at FROM users WHERE id = $1', [userId]),
    query('SELECT * FROM categories WHERE user_id = $1', [userId]),
    query('SELECT * FROM tags WHERE user_id = $1', [userId]),
    query('SELECT * FROM collections WHERE user_id = $1', [userId]),
  ]);

  const diariesResult = await query(
    'SELECT id FROM diaries WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at',
    [userId]
  );

  const diaries = await Promise.all(
    diariesResult.rows.map((r) => diaryService.getDiary(userId, r.id))
  );

  const collectionItems = await query(
    `SELECT ci.* FROM collection_items ci
     JOIN collections c ON c.id = ci.collection_id
     WHERE c.user_id = $1`,
    [userId]
  );

  return {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    user: user.rows[0],
    categories: categories.rows,
    tags: tags.rows,
    diaries,
    collections: collections.rows,
    collectionItems: collectionItems.rows,
    notice: 'AI 功能已剥离，本导出仅包含用户手动创建的内容',
  };
}

export function toMarkdown(exportData: Awaited<ReturnType<typeof exportUserData>>): string {
  const lines: string[] = [
    '# AniDiary 数据导出',
    '',
    `导出时间: ${exportData.exportedAt}`,
    '',
    '## 日记',
    '',
  ];

  for (const diary of exportData.diaries) {
    lines.push(`### ${diary.title}`);
    lines.push(`- 日期: ${diary.createdAt}`);
    if (diary.mood) lines.push(`- 心情: ${diary.mood}`);
    lines.push('');
    lines.push(diary.content.replace(/<[^>]+>/g, ''));
    lines.push('');
  }

  return lines.join('\n');
}
