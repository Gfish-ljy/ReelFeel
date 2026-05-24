import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import * as tokenStore from '../config/tokenStore.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { env } from '../config/env.js';

const SALT_ROUNDS = 12;

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  nickname: string;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function register(email: string, password: string, nickname?: string) {
  const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    throw new Error('该邮箱已被注册');
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const nick = nickname || email.split('@')[0];
  const result = await query<UserRow>(
    `INSERT INTO users (email, password_hash, nickname) VALUES ($1, $2, $3)
     RETURNING id, email, nickname, avatar_url, created_at, updated_at`,
    [email.toLowerCase(), passwordHash, nick]
  );
  return result.rows[0];
}

export async function login(email: string, password: string) {
  const result = await query<UserRow>(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  const user = result.rows[0];
  if (!user) throw new Error('邮箱或密码错误');
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('邮箱或密码错误');
  return issueTokens(user);
}

export async function issueTokens(user: Pick<UserRow, 'id' | 'email'>) {
  const payload = { userId: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const ttlSeconds = 7 * 24 * 60 * 60;
  await tokenStore.setRefreshToken(user.id, refreshToken, ttlSeconds);
  return { accessToken, refreshToken, user: sanitizeUser(user) };
}

function sanitizeUser(user: Partial<UserRow>) {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export async function refresh(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const stored = await tokenStore.getRefreshToken(payload.userId);
  if (!stored || stored !== refreshToken) {
    throw new Error('Refresh token 无效');
  }
  const result = await query<UserRow>('SELECT * FROM users WHERE id = $1', [payload.userId]);
  const user = result.rows[0];
  if (!user) throw new Error('用户不存在');
  return issueTokens(user);
}

export async function logout(userId: string) {
  await tokenStore.deleteRefreshToken(userId);
}

export async function getProfile(userId: string) {
  const result = await query<UserRow>(
    'SELECT id, email, nickname, avatar_url, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );
  const user = result.rows[0];
  if (!user) throw new Error('用户不存在');
  return sanitizeUser(user);
}

export async function updateProfile(
  userId: string,
  data: { nickname?: string; avatarUrl?: string }
) {
  const result = await query<UserRow>(
    `UPDATE users SET
      nickname = COALESCE($2, nickname),
      avatar_url = COALESCE($3, avatar_url)
     WHERE id = $1
     RETURNING id, email, nickname, avatar_url, created_at, updated_at`,
    [userId, data.nickname, data.avatarUrl]
  );
  return sanitizeUser(result.rows[0]);
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  const result = await query<UserRow>('SELECT password_hash FROM users WHERE id = $1', [userId]);
  const user = result.rows[0];
  if (!user) throw new Error('用户不存在');
  const valid = await bcrypt.compare(oldPassword, user.password_hash);
  if (!valid) throw new Error('原密码错误');
  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
}

export async function uploadAvatar(userId: string, buffer: Buffer, mime: string) {
  const { uploadImage } = await import('./storage.service.js');
  const ext = mime.split('/')[1] || 'jpg';
  const key = `avatars/${userId}/${uuidv4()}.${ext}`;
  const url = await uploadImage(key, buffer, mime);
  return updateProfile(userId, { avatarUrl: url });
}
