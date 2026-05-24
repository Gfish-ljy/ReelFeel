import { query } from '../config/database.js';
import * as diaryService from './diary.service.js';

export async function listCollections(userId: string) {
  const result = await query(
    `SELECT c.*,
      (SELECT COUNT(*) FROM collection_items ci WHERE ci.collection_id = c.id)::text AS item_count
     FROM collections c WHERE c.user_id = $1 ORDER BY c.updated_at DESC`,
    [userId]
  );
  return result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    coverImageUrl: r.cover_image_url,
    itemCount: parseInt(r.item_count, 10),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function getCollection(userId: string, collectionId: string) {
  const result = await query(
    'SELECT * FROM collections WHERE id = $1 AND user_id = $2',
    [collectionId, userId]
  );
  const col = result.rows[0];
  if (!col) throw new Error('影集不存在');

  const items = await query(
    `SELECT ci.*, d.title, d.created_at AS diary_created_at
     FROM collection_items ci
     JOIN diaries d ON d.id = ci.diary_id AND d.deleted_at IS NULL
     WHERE ci.collection_id = $1
     ORDER BY ci.sort_order`,
    [collectionId]
  );

  const diaries = await Promise.all(
    items.rows.map(async (item) => {
      const diary = await diaryService.getDiary(userId, item.diary_id);
      return { ...diary, sortOrder: item.sort_order, addedAt: item.added_at };
    })
  );

  return {
    id: col.id,
    name: col.name,
    description: col.description,
    coverImageUrl: col.cover_image_url,
    createdAt: col.created_at,
    updatedAt: col.updated_at,
    items: diaries,
  };
}

export async function createCollection(
  userId: string,
  data: { name: string; description?: string; coverImageUrl?: string }
) {
  const result = await query(
    `INSERT INTO collections (user_id, name, description, cover_image_url)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, data.name, data.description || null, data.coverImageUrl || null]
  );
  const r = result.rows[0];
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    coverImageUrl: r.cover_image_url,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    items: [],
  };
}

export async function updateCollection(
  userId: string,
  collectionId: string,
  data: { name?: string; description?: string; coverImageUrl?: string }
) {
  const result = await query(
    `UPDATE collections SET
      name = COALESCE($3, name),
      description = COALESCE($4, description),
      cover_image_url = COALESCE($5, cover_image_url)
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [collectionId, userId, data.name, data.description, data.coverImageUrl]
  );
  if (!result.rows.length) throw new Error('影集不存在');
  return getCollection(userId, collectionId);
}

export async function deleteCollection(userId: string, collectionId: string) {
  const result = await query(
    'DELETE FROM collections WHERE id = $1 AND user_id = $2 RETURNING id',
    [collectionId, userId]
  );
  if (!result.rows.length) throw new Error('影集不存在');
}

export async function addCollectionItem(
  userId: string,
  collectionId: string,
  diaryId: string,
  sortOrder?: number
) {
  const col = await query(
    'SELECT id FROM collections WHERE id = $1 AND user_id = $2',
    [collectionId, userId]
  );
  if (!col.rows.length) throw new Error('影集不存在');

  const diary = await query(
    'SELECT id FROM diaries WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    [diaryId, userId]
  );
  if (!diary.rows.length) throw new Error('日记不存在');

  let order = sortOrder;
  if (order === undefined) {
    const max = await query<{ max: number | null }>(
      'SELECT MAX(sort_order) AS max FROM collection_items WHERE collection_id = $1',
      [collectionId]
    );
    order = (max.rows[0]?.max ?? -1) + 1;
  }

  await query(
    `INSERT INTO collection_items (collection_id, diary_id, sort_order)
     VALUES ($1, $2, $3)
     ON CONFLICT (collection_id, diary_id) DO UPDATE SET sort_order = $3`,
    [collectionId, diaryId, order]
  );

  return getCollection(userId, collectionId);
}

export async function removeCollectionItem(
  userId: string,
  collectionId: string,
  diaryId: string
) {
  await query(
    `DELETE FROM collection_items ci
     USING collections c
     WHERE ci.collection_id = c.id AND c.user_id = $1
       AND ci.collection_id = $2 AND ci.diary_id = $3`,
    [userId, collectionId, diaryId]
  );
  return getCollection(userId, collectionId);
}

export async function reorderCollectionItems(
  userId: string,
  collectionId: string,
  itemOrders: { diaryId: string; sortOrder: number }[]
) {
  const col = await query(
    'SELECT id FROM collections WHERE id = $1 AND user_id = $2',
    [collectionId, userId]
  );
  if (!col.rows.length) throw new Error('影集不存在');

  for (const item of itemOrders) {
    await query(
      'UPDATE collection_items SET sort_order = $3 WHERE collection_id = $1 AND diary_id = $2',
      [collectionId, item.diaryId, item.sortOrder]
    );
  }
  return getCollection(userId, collectionId);
}
