import { query } from '../config/database.js';

export async function listTags(userId: string) {
  const result = await query(
    'SELECT * FROM tags WHERE user_id = $1 ORDER BY name',
    [userId]
  );
  return result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
  }));
}

export async function createTag(userId: string, name: string) {
  const result = await query(
    'INSERT INTO tags (user_id, name) VALUES ($1, $2) RETURNING *',
    [userId, name]
  );
  const r = result.rows[0];
  return { id: r.id, name: r.name, createdAt: r.created_at };
}

export async function deleteTag(userId: string, id: string) {
  const result = await query(
    'DELETE FROM tags WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  if (!result.rows.length) throw new Error('标签不存在');
}
