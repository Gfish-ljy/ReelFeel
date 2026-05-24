import { query } from '../config/database.js';

export async function listCategories(userId: string) {
  const result = await query(
    'SELECT * FROM categories WHERE user_id = $1 ORDER BY sort_order, created_at',
    [userId]
  );
  return result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
  }));
}

export async function createCategory(userId: string, name: string, color?: string) {
  const result = await query(
    `INSERT INTO categories (user_id, name, color)
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, name, color || '#6366f1']
  );
  const r = result.rows[0];
  return { id: r.id, name: r.name, color: r.color, sortOrder: r.sort_order };
}

export async function updateCategory(
  userId: string,
  id: string,
  data: { name?: string; color?: string; sortOrder?: number }
) {
  const result = await query(
    `UPDATE categories SET
      name = COALESCE($3, name),
      color = COALESCE($4, color),
      sort_order = COALESCE($5, sort_order)
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId, data.name, data.color, data.sortOrder]
  );
  if (!result.rows.length) throw new Error('分类不存在');
  const r = result.rows[0];
  return { id: r.id, name: r.name, color: r.color, sortOrder: r.sort_order };
}

export async function deleteCategory(userId: string, id: string) {
  const result = await query(
    'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  if (!result.rows.length) throw new Error('分类不存在');
}
