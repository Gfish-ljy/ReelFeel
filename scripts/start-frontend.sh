#!/usr/bin/env bash
# 启动前端开发服务器（含环境检查）
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/frontend"
LOG_ENDPOINT="http://127.0.0.1:7302/ingest/3742cc07-fe7f-4e59-851e-bc6d2da6d781"
SESSION="dcb5be"

agent_log() {
  local hyp="$1" loc="$2" msg="$3" data="$4"
  # #region agent log
  curl -s -X POST "$LOG_ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "X-Debug-Session-Id: $SESSION" \
    -d "{\"sessionId\":\"$SESSION\",\"runId\":\"start-frontend\",\"hypothesisId\":\"$hyp\",\"location\":\"$loc\",\"message\":\"$msg\",\"data\":$data,\"timestamp\":$(date +%s000)}" \
    >/dev/null 2>&1 || true
  # #endregion
}

if ! command -v npm >/dev/null 2>&1; then
  agent_log "H3" "start-frontend:npm" "npm missing" "{\"ok\":false}"
  echo "❌ 未找到 npm。请先安装 Node.js 20+："
  echo "   https://nodejs.org/  或  brew install node"
  echo "   安装后重新打开终端，再运行: bash scripts/start-frontend.sh"
  exit 1
fi

if [ ! -d "$FRONTEND/node_modules" ]; then
  agent_log "H2" "start-frontend:install" "running npm install" "{\"ok\":true}"
  echo "📦 首次运行，正在安装前端依赖..."
  (cd "$FRONTEND" && npm install)
fi

agent_log "H1" "start-frontend:dev" "starting vite" "{\"ok\":true}"
echo "🚀 启动前端: http://localhost:5173"
cd "$FRONTEND" && npm run dev
