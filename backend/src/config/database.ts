import { readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { env } from './env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '../../migrations');

let pool: pg.Pool | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pgliteDb: any = null;
let dbMode: 'postgres' | 'pglite' = 'postgres';

async function initPglite(): Promise<void> {
  const { PGlite } = await import('@electric-sql/pglite');
  if (!existsSync(env.pgliteDataDir)) {
    mkdirSync(env.pgliteDataDir, { recursive: true });
  }
  pgliteDb = new PGlite(env.pgliteDataDir);
  const sql = readFileSync(join(migrationsDir, '001_init_pglite.sql'), 'utf8');
  await pgliteDb.exec(sql);
  dbMode = 'pglite';
  console.log(`[database] 使用 PGlite 本地数据库: ${env.pgliteDataDir}`);
}

async function initPostgres(): Promise<void> {
  pool = new pg.Pool({ connectionString: env.databaseUrl });
  pool.on('error', (err) => {
    console.error('Unexpected database error', err);
  });
  await pool.query('SELECT 1');
  dbMode = 'postgres';
  console.log('[database] 已连接 PostgreSQL');
}

export async function initDatabase(): Promise<void> {
  if (env.usePglite) {
    await initPglite();
    return;
  }

  if (env.nodeEnv === 'development' && env.autoPgliteFallback) {
    try {
      await initPostgres();
      return;
    } catch {
      console.warn('[database] PostgreSQL 不可用，开发模式自动切换 PGlite（无需 Docker）');
      pool = null;
      await initPglite();
      return;
    }
  }

  await initPostgres();
}

export function getDatabaseMode() {
  return dbMode;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  if (pgliteDb) {
    const result = await pgliteDb.query(text, params);
    return result as pg.QueryResult<T>;
  }
  if (!pool) {
    throw new Error('数据库未初始化');
  }
  return pool.query<T>(text, params);
}
