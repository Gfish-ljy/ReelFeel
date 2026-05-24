#!/usr/bin/env node
/**
 * 前端无法打开 — 环境诊断（Debug session dcb5be）
 * 运行: node scripts/diagnose-frontend.mjs
 */
import { execSync } from 'child_process';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FRONTEND = join(ROOT, 'frontend');
const LOG_ENDPOINT =
  'http://127.0.0.1:7302/ingest/3742cc07-fe7f-4e59-851e-bc6d2da6d781';
const LOG_FILE = join(ROOT, '.cursor', 'debug-dcb5be.log');
const SESSION = 'dcb5be';

function log(hypothesisId, location, message, data) {
  const payload = {
    sessionId: SESSION,
    runId: 'diagnose',
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  // #region agent log
  fetch(LOG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': SESSION },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
  try {
    mkdirSync(join(ROOT, '.cursor'), { recursive: true });
    appendFileSync(LOG_FILE, `${JSON.stringify(payload)}\n`);
  } catch {
    /* ignore */
  }
  console.log(`[${hypothesisId}] ${message}`, data ? JSON.stringify(data) : '');
}

function tryExec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    return { error: e.message || String(e), status: e.status };
  }
}

// H1: 开发服务器未启动 / 5173 无监听
let port5173 = 'none';
const lsof = tryExec('lsof -i :5173 -sTCP:LISTEN 2>/dev/null | tail -n +2');
if (typeof lsof === 'string' && lsof.length > 0) port5173 = lsof.split('\n')[0] || 'listening';
log('H1', 'diagnose:port5173', 'Port 5173 listen check', { listening: port5173 !== 'none', detail: port5173 });

// H2: 未安装依赖 (node_modules 缺失)
const hasNodeModules = existsSync(join(FRONTEND, 'node_modules'));
const hasPkgLock = existsSync(join(FRONTEND, 'package-lock.json'));
log('H2', 'diagnose:node_modules', 'Frontend node_modules check', {
  hasNodeModules,
  hasPkgLock,
  frontendPath: FRONTEND,
});

// H3: npm/node 不在 PATH，无法 npm install / npm run dev
const nodeVer = process.version;
const npmWhich = tryExec('which npm 2>/dev/null');
const npmVer =
  typeof npmWhich === 'string' && !npmWhich.error
    ? tryExec('npm -v 2>/dev/null')
  : 'NOT_FOUND';
log('H3', 'diagnose:npm', 'npm availability', {
  nodeVersion: nodeVer,
  npmPath: npmWhich,
  npmVersion: npmVer,
});

// H4: HTTP 无法访问 localhost:5173
let httpStatus = 'unreachable';
try {
  const res = await fetch('http://localhost:5173/', { signal: AbortSignal.timeout(3000) });
  httpStatus = String(res.status);
} catch (e) {
  httpStatus = e.cause?.code || e.message || 'fetch_failed';
}
log('H4', 'diagnose:http', 'HTTP GET localhost:5173', { httpStatus });
if (httpStatus === 'ECONNREFUSED' || String(httpStatus).includes('ECONNREFUSED')) {
  log('H4', 'diagnose:chrome-102', 'Chrome Error -102 maps to ERR_CONNECTION_REFUSED', {
    chromeErrorCode: -102,
    meaning: '本机 5173 端口无服务在监听，需先启动前端开发服务器',
  });
}

// H5: Docker 未运行或前端容器未启动
const dockerPs = tryExec('docker ps --format "{{.Names}}\t{{.Status}}" 2>/dev/null');
const dockerOk = typeof dockerPs === 'string' && !dockerPs.error;
const hasFrontendContainer =
  dockerOk && dockerPs.includes('anidiary-frontend');
log('H5', 'diagnose:docker', 'Docker / anidiary-frontend container', {
  dockerOk,
  hasFrontendContainer,
  containers: dockerOk ? dockerPs.split('\n').slice(0, 8) : dockerPs,
});

const blocked = !hasNodeModules || npmVer === 'NOT_FOUND' || httpStatus === 'ECONNREFUSED';
if (blocked) {
  console.log('\n⚠️  浏览器 Error -102：连接被拒绝 → 开发服务器未启动（见上方 H1/H4）');
  if (npmVer === 'NOT_FOUND') {
    console.log('   请先安装 Node.js：https://nodejs.org/  然后执行: bash scripts/start-frontend.sh');
  } else if (!hasNodeModules) {
    console.log('   请执行: cd frontend && npm install && npm run dev');
  } else {
    console.log('   请执行: bash scripts/start-frontend.sh');
  }
}
console.log('\n--- 诊断完成 ---');
