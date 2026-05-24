# 漫日记 (AniDiary) — 基础版

图文日记 Web 应用：支持富文本日记、手动分类/标签、影集管理、时间轴/日历回顾、离线缓存与数据导出。

> **AI 功能已剥离，待后续迭代**  
> 本版本不包含任何 AI 大模型交互、智能转绘、AI 剧本/动画生成、智能分类或情绪分析等功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18、TypeScript、Vite、Tailwind CSS、TipTap、Zustand、Dexie.js、PWA |
| 后端 | Node.js、Express、TypeScript、PostgreSQL、Redis、MinIO |
| 认证 | JWT（Access + Refresh Token） |
| 部署 | Docker Compose |

## 项目结构

```
.
├── docker-compose.yml      # 一键启动全套服务
├── .env.example            # 环境变量模板
├── backend/
│   ├── migrations/         # 数据库初始化 SQL
│   └── src/
│       ├── routes/         # REST 路由
│       ├── controllers/
│       ├── services/
│       └── tests/          # API 单元测试
└── frontend/
    └── src/
        ├── pages/          # 登录、时间轴、日历、编辑器、影集、设置
        ├── components/
        └── lib/            # API、IndexedDB、图片压缩、同步
```

## 后端启动报 `EADDRINUSE :::3001`？

说明 **3001 端口已有后端在运行**（常见于重复执行 `npm run dev:backend`）。

```bash
# 检查是否已在运行
curl http://localhost:3001/api/v1/health

# 若要重启后端，先结束旧进程
npm run stop:backend
npm run dev:backend
```

终端里的 `Redis 不可用`、`MinIO bucket init skipped` 仅为**警告**，不阻止注册/登录（图片上传需 MinIO）。

## 注册 / 登录失败？

注册需要 **后端 API** 运行；数据库在开发环境下若未安装 PostgreSQL，会**自动使用 PGlite**（无需 Docker）。

仅 `npm run dev`（前端）不够，还需后端。

```bash
# 推荐：一键启动（需 Docker Desktop）
npm run dev:all
```

或分步：

```bash
docker compose up -d postgres redis    # 数据库
npm run dev:backend                     # 终端 1
npm run dev                             # 终端 2（前端）
```

常见报错：

| 现象 | 原因 |
|------|------|
| `Failed to fetch` / 无法连接后端 | 未运行 `npm run dev:backend` |
| 数据库未连接 | 未运行 `docker compose up -d postgres` |
| 空白错误提示 | 已修复：会显示具体数据库连接提示 |

## 前端打不开？

常见原因（可用诊断脚本确认）：

```bash
node scripts/diagnose-frontend.mjs
```

| 现象 | 原因 | 处理 |
|------|------|------|
| 浏览器「无法连接」 | 开发服务器未启动 | 见下方「本地开发」启动 `npm run dev` |
| `npm: command not found` | 未安装 Node.js/npm | 安装 [Node.js 20+](https://nodejs.org/) 后重开终端 |
| 从未执行过 install | 缺少 `frontend/node_modules` | `cd frontend && npm install` |
| Docker 方式失败 | Docker 未安装或未启动 | 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/) |

安装 Node 后启动前端（任选其一）：

```bash
# 在项目根目录（项目本体）可直接：
npm run dev

# 或进入 frontend 目录：
cd frontend && npm run dev

# 或使用脚本：
bash scripts/start-frontend.sh
```

## 快速开始

### 方式一：Docker Compose（推荐）

```bash
# 1. 复制环境变量
cp .env.example .env

# 2. 启动所有服务（PostgreSQL、Redis、MinIO、后端、前端）
docker compose up -d

# 3. 访问
# 前端: http://localhost:5173
# 后端 API: http://localhost:3001/api/v1
# MinIO 控制台: http://localhost:9001 (minioadmin / minioadmin123)
```

### 方式二：本地开发

**前置依赖**：Node.js 20+、PostgreSQL 16、Redis 7、MinIO（或兼容 S3）

```bash
# 1. 启动基础设施
docker compose up -d postgres redis minio minio-init

# 2. 配置环境变量
cp .env.example .env

# 3. 后端
cd backend
npm install
npm run dev

# 4. 前端（新终端）
cd frontend
npm install
npm run dev
```

### 运行测试

```bash
cd backend
npm test
```

## API 概览

前缀：`/api/v1`，统一响应：

```json
{ "code": 200, "data": {}, "message": "success" }
```

| 模块 | 端点 |
|------|------|
| 认证 | `POST /auth/register`, `/login`, `/refresh`, `GET /auth/profile` |
| 日记 | `GET/POST /diaries`, `GET/PUT/DELETE /diaries/:id`, `POST /diaries/:id/images` |
| 分类 | `GET/POST /categories`, `PUT/DELETE /categories/:id` |
| 标签 | `GET/POST /tags`, `DELETE /tags/:id` |
| 影集 | `GET/POST /collections`, `POST /collections/:id/items` |
| 导出 | `GET /export/data?format=json\|markdown` |

## 已完成功能清单

### 模块 A：用户系统
- [x] 邮箱 + 密码注册/登录
- [x] JWT Access + Refresh Token（Redis 存储 Refresh）
- [x] 个人资料（昵称）、密码修改、头像上传

### 模块 B：图文日记
- [x] TipTap 富文本编辑器 + 多图上传
- [x] 时间轴视图 + 日历视图
- [x] 日记 CRUD + 软删除
- [x] 按关键词、分类、标签筛选
- [x] 前端 Canvas 压缩（1920px）+ 后端 Sharp 缩略图 + MinIO 存储

### 模块 C：分类与标签（纯手动）
- [x] 分类 CRUD（设置页管理）
- [x] 标签创建/删除
- [x] 日记编辑时手动选择分类/标签

### 模块 D：个人影集
- [x] 影集创建、编辑描述
- [x] 手动添加日记条目
- [x] 幻灯片/卡片流浏览
- [x] 双影集左右分栏「时光对比」

### 模块 E：数据与隐私
- [x] IndexedDB 离线草稿 + 联网同步
- [x] JSON / Markdown 数据导出
- [x] PWA 离线缓存基础配置

### 非功能
- [x] 响应式布局
- [x] 图片懒加载、虚拟滚动（日记 > 100）
- [x] bcrypt 密码加密、XSS HTML 过滤、上传类型白名单
- [x] Rate limiting、Helmet 安全头

## 明确排除（本版本不做）

- ❌ AI 大模型交互
- ❌ 智能转绘 / Stable Diffusion 等
- ❌ AI 叙事 / 动画生成
- ❌ AI 智能分类、关键词提取
- ❌ 角色一致性 Avatar、自动 BGM

## 开发里程碑对照

| 阶段 | 状态 |
|------|------|
| Week 1-2：脚手架 + 认证 + 日记 CRUD + 图片上传 | ✅ |
| Week 3：分类标签 + 时间轴/日历 + 搜索筛选 | ✅ |
| Week 4：影集 + 时光对比 + 数据导出 | ✅ |
| Week 5：IndexedDB + PWA + 测试 + Docker | ✅ |

## 许可证

MIT
