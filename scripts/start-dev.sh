#!/usr/bin/env bash
# 启动数据库 + 后端 + 前端（注册/登录需要全套服务）
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if command -v docker >/dev/null 2>&1; then
  echo "🐳 启动 PostgreSQL / Redis / MinIO..."
  docker compose -p anidiary up -d postgres redis minio minio-init
  echo "   等待数据库就绪..."
  sleep 4
else
  echo "⚠️  未检测到 Docker。请自行确保 PostgreSQL(5432) 已运行并已执行 migrations。"
  echo "   否则注册会失败。"
fi

if [ ! -d "$ROOT/backend/node_modules" ] || [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "📦 安装依赖..."
  npm run install:all
fi

echo "🚀 启动后端 (3001) 与前端 (5173)..."
echo "   注册页: http://localhost:5173/register"
trap 'kill 0' EXIT

npm run dev:backend &
sleep 2
npm run dev:frontend
