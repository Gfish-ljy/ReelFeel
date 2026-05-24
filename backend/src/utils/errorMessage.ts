export function getErrorMessage(err: unknown): string {
  if (err instanceof AggregateError) {
    const first = err.errors[0];
    if (first instanceof Error && first.message) return mapSystemError(first.message);
    return '服务依赖未就绪，请检查 PostgreSQL 与 Redis 是否已启动';
  }
  if (err instanceof Error) {
    if (err.message) return mapSystemError(err.message);
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ECONNREFUSED') {
      return '无法连接数据库或缓存，请先启动 PostgreSQL（端口 5432）';
    }
  }
  return '服务器内部错误';
}

function mapSystemError(message: string): string {
  if (/ECONNREFUSED.*5432|connect ECONNREFUSED.*5432/i.test(message)) {
    return '数据库未连接：请先启动 PostgreSQL。可执行 docker compose up -d postgres';
  }
  if (/ECONNREFUSED.*6379/i.test(message)) {
    return 'Redis 未连接（已尝试内存回退，若仍失败请启动 Redis 或重启后端）';
  }
  if (/relation "users" does not exist/i.test(message)) {
    return '数据库表未初始化：请执行 docker compose up -d postgres 并确保 migrations 已应用';
  }
  return message;
}
