import { query } from '../config/database.js';
import { sanitizeRichText } from '../utils/sanitize.js';
import { processAndUploadDiaryImage } from './storage.service.js';

export interface DiaryRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface DiaryImageRow {
  id: string;
  diary_id: string;
  image_url: string;
  thumbnail_url: string | null;
  sort_order: number;
}

export interface DiaryListParams {
  userId: string;
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

function mapDiary(row: DiaryRow, extras?: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    mood: row.mood,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...extras,
  };
}

export async function listDiaries(params: DiaryListParams) {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 100);
  const offset = (page - 1) * limit;

  const conditions: string[] = ['d.user_id = $1', 'd.deleted_at IS NULL'];
  const values: unknown[] = [params.userId];
  let idx = 2;

  if (params.keyword) {
    conditions.push(`(d.title ILIKE $${idx} OR d.content ILIKE $${idx})`);
    values.push(`%${params.keyword}%`);
    idx++;
  }
  if (params.startDate) {
    conditions.push(`d.created_at >= $${idx}::timestamptz`);
    values.push(params.startDate);
    idx++;
  }
  if (params.endDate) {
    conditions.push(`d.created_at <= $${idx}::timestamptz`);
    values.push(params.endDate);
    idx++;
  }
  if (params.category) {
    conditions.push(`EXISTS (
      SELECT 1 FROM diary_categories dc
      JOIN categories c ON c.id = dc.category_id
      WHERE dc.diary_id = d.id AND c.id = $${idx}
    )`);
    values.push(params.category);
    idx++;
  }
  if (params.tag) {
    conditions.push(`EXISTS (
      SELECT 1 FROM diary_tags dt
      JOIN tags t ON t.id = dt.tag_id
      WHERE dt.diary_id = d.id AND t.id = $${idx}
    )`);
    values.push(params.tag);
    idx++;
  }

  const where = conditions.join(' AND ');
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM diaries d WHERE ${where}`,
    values
  );

  values.push(limit, offset);
  const rows = await query<DiaryRow & { image_count: string }>(
    `SELECT d.*,
      (SELECT COUNT(*) FROM diary_images di WHERE di.diary_id = d.id)::text AS image_count
     FROM diaries d
     WHERE ${where}
     ORDER BY d.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    values
  );

  const diaries = await Promise.all(
    rows.rows.map(async (row) => {
      const [images, categories, tags] = await Promise.all([
        getDiaryImages(row.id),
        getDiaryCategories(row.id),
        getDiaryTags(row.id),
      ]);
      return {
        ...mapDiary(row),
        imageCount: parseInt(row.image_count, 10),
        images,
        categories,
        tags,
      };
    })
  );

  return {
    items: diaries,
    total: parseInt(countResult.rows[0]?.count || '0', 10),
    page,
    limit,
  };
}

async function getDiaryImages(diaryId: string) {
  const result = await query<DiaryImageRow>(
    'SELECT * FROM diary_images WHERE diary_id = $1 ORDER BY sort_order',
    [diaryId]
  );
  return result.rows.map((img) => ({
    id: img.id,
    imageUrl: img.image_url,
    thumbnailUrl: img.thumbnail_url,
    sortOrder: img.sort_order,
  }));
}

async function getDiaryCategories(diaryId: string) {
  const result = await query<{ id: string; name: string; color: string }>(
    `SELECT c.id, c.name, c.color FROM categories c
     JOIN diary_categories dc ON dc.category_id = c.id
     WHERE dc.diary_id = $1`,
    [diaryId]
  );
  return result.rows;
}

async function getDiaryTags(diaryId: string) {
  const result = await query<{ id: string; name: string }>(
    `SELECT t.id, t.name FROM tags t
     JOIN diary_tags dt ON dt.tag_id = t.id
     WHERE dt.diary_id = $1`,
    [diaryId]
  );
  return result.rows;
}

export async function getDiary(userId: string, diaryId: string) {
  const result = await query<DiaryRow>(
    'SELECT * FROM diaries WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    [diaryId, userId]
  );
  const row = result.rows[0];
  if (!row) throw new Error('日记不存在');
  const [images, categories, tags] = await Promise.all([
    getDiaryImages(diaryId),
    getDiaryCategories(diaryId),
    getDiaryTags(diaryId),
  ]);
  return { ...mapDiary(row), images, categories, tags };
}

export async function createDiary(
  userId: string,
  data: {
    title: string;
    content: string;
    mood?: string;
    categoryIds?: string[];
    tagIds?: string[];
  }
) {
  const result = await query<DiaryRow>(
    `INSERT INTO diaries (user_id, title, content, mood)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, data.title, sanitizeRichText(data.content), data.mood || null]
  );
  const diary = result.rows[0];
  if (data.categoryIds?.length) await setDiaryCategories(diary.id, data.categoryIds);
  if (data.tagIds?.length) await setDiaryTags(diary.id, data.tagIds);
  return getDiary(userId, diary.id);
}

export async function updateDiary(
  userId: string,
  diaryId: string,
  data: {
    title?: string;
    content?: string;
    mood?: string;
    categoryIds?: string[];
    tagIds?: string[];
  }
) {
  const existing = await query(
    'SELECT id FROM diaries WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    [diaryId, userId]
  );
  if (!existing.rows.length) throw new Error('日记不存在');

  await query(
    `UPDATE diaries SET
      title = COALESCE($3, title),
      content = COALESCE($4, content),
      mood = COALESCE($5, mood)
     WHERE id = $1 AND user_id = $2`,
    [
      diaryId,
      userId,
      data.title,
      data.content !== undefined ? sanitizeRichText(data.content) : undefined,
      data.mood,
    ]
  );

  if (data.categoryIds !== undefined) {
    await query('DELETE FROM diary_categories WHERE diary_id = $1', [diaryId]);
    if (data.categoryIds.length) await setDiaryCategories(diaryId, data.categoryIds);
  }
  if (data.tagIds !== undefined) {
    await query('DELETE FROM diary_tags WHERE diary_id = $1', [diaryId]);
    if (data.tagIds.length) await setDiaryTags(diaryId, data.tagIds);
  }

  return getDiary(userId, diaryId);
}

export async function deleteDiary(userId: string, diaryId: string) {
  const result = await query(
    `UPDATE diaries SET deleted_at = NOW()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id`,
    [diaryId, userId]
  );
  if (!result.rows.length) throw new Error('日记不存在');
}

async function setDiaryCategories(diaryId: string, categoryIds: string[]) {
  for (const categoryId of categoryIds) {
    await query(
      'INSERT INTO diary_categories (diary_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [diaryId, categoryId]
    );
  }
}

async function setDiaryTags(diaryId: string, tagIds: string[]) {
  for (const tagId of tagIds) {
    await query(
      'INSERT INTO diary_tags (diary_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [diaryId, tagId]
    );
  }
}

export async function uploadDiaryImages(
  userId: string,
  diaryId: string,
  files: Express.Multer.File[]
) {
  const existing = await query(
    'SELECT id FROM diaries WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    [diaryId, userId]
  );
  if (!existing.rows.length) throw new Error('日记不存在');

  const countResult = await query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM diary_images WHERE diary_id = $1',
    [diaryId]
  );
  let sortOrder = parseInt(countResult.rows[0]?.count || '0', 10);

  const uploaded = [];
  for (const file of files) {
    const processed = await processAndUploadDiaryImage(
      diaryId,
      file.buffer,
      file.mimetype,
      sortOrder++
    );
    const insert = await query<DiaryImageRow>(
      `INSERT INTO diary_images (diary_id, image_url, thumbnail_url, sort_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [diaryId, processed.imageUrl, processed.thumbnailUrl, processed.sortOrder]
    );
    const img = insert.rows[0];
    uploaded.push({
      id: img.id,
      imageUrl: img.image_url,
      thumbnailUrl: img.thumbnail_url,
      sortOrder: img.sort_order,
    });
  }
  return uploaded;
}

export async function getDiariesByDateRange(userId: string, year: number, month: number) {
  const start = new Date(year, month - 1, 1).toISOString();
  const end = new Date(year, month, 0, 23, 59, 59).toISOString();
  const result = await query<{ id: string; title: string; created_at: Date }>(
    `SELECT id, title, created_at FROM diaries
     WHERE user_id = $1 AND deleted_at IS NULL
       AND created_at >= $2 AND created_at <= $3
     ORDER BY created_at`,
    [userId, start, end]
  );
  return result.rows.map((r) => ({
    id: r.id,
    title: r.title,
    date: r.created_at.toISOString().split('T')[0],
  }));
}
