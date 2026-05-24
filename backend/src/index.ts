import { createApp } from './app.js';
import { env } from './config/env.js';
import { initDatabase } from './config/database.js';
import { ensureBucket } from './config/minio.js';

async function main() {
  await initDatabase();

  try {
    await ensureBucket();
  } catch (err) {
    console.warn('MinIO bucket init skipped (may start later):', err);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`AniDiary API running on http://localhost:${env.port}/api/v1`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ 端口 ${env.port} 已被占用，无法重复启动后端。`);
      console.error('   若健康检查正常，说明后端已在运行，无需再开第二个终端：');
      console.error(`   curl http://localhost:${env.port}/api/v1/health`);
      console.error('   若要重启，先结束旧进程：');
      console.error(`   npm run stop:backend   # 或在项目根目录执行`);
      console.error(`   lsof -ti :${env.port} | xargs kill\n`);
      process.exit(1);
    }
    throw err;
  });
}

main();
