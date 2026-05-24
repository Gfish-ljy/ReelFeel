#!/usr/bin/env bash
# 检查注册所需服务是否就绪
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

backend_ok=false
pg_ok=false
frontend_ok=false
register_ok=false

curl -sf http://localhost:3001/api/v1/health >/dev/null 2>&1 && backend_ok=true
nc -z localhost 5432 2>/dev/null && pg_ok=true
nc -z localhost 5173 2>/dev/null && frontend_ok=true

if $backend_ok; then
  reg=$(curl -sf -X POST http://localhost:3001/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"check$(date +%s)@test.com\",\"password\":\"password123\"}" 2>/dev/null)
  echo "$reg" | grep -q '"code":201' && register_ok=true
  echo "$reg" | grep -q '"code":200' && register_ok=true
fi

$backend_ok && echo "✅ 后端 API (3001)" || echo "❌ 后端 API (3001)"
$pg_ok && echo "✅ PostgreSQL (5432)" || echo "⚪ PostgreSQL (5432) 未运行（可用 PGlite 回退）"
$frontend_ok && echo "✅ 前端 Vite (5173)" || echo "❌ 前端 Vite (5173)"
$register_ok && echo "✅ 注册接口可用" || echo "❌ 注册接口不可用"

echo ""
if $backend_ok && $register_ok && $frontend_ok; then
  echo "全部就绪，可以注册: http://localhost:5173/register"
  exit 0
fi

echo "待处理："
if ! $backend_ok; then
  echo "  • 启动后端: npm run dev:backend"
elif ! $register_ok; then
  echo "  • 重启后端以加载 PGlite: npm run stop:backend && npm run dev:backend"
fi
$frontend_ok || echo "  • 启动前端: npm run dev"
if ! $pg_ok && ! $register_ok; then
  echo "  • 或启动 Docker: docker compose up -d postgres"
fi
exit 1
