# AMZ Auto AI - 电商优化工具

一个基于 Next.js、FastAPI、Dify 和 PostgreSQL 构建的智能电商优化工具平台。

## 🏗️ 技术栈

### 前端
- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - 现代化 UI 组件库（基于 Radix UI）
- **Magic UI** - 高级动画和交互组件
- **Framer Motion** - 流畅的动画效果
- **Radix UI** - 底层无头组件
- **Axios** - HTTP 客户端
- **Zustand** - 状态管理
- **Lucide React** - 图标库

### 后端
- **FastAPI** - 高性能 Python Web 框架
- **SQLAlchemy** - ORM
- **PostgreSQL** - 关系型数据库
- **Redis** - 缓存和会话管理
- **Dify** - AI 工作流集成

### UI 组件库
- **shadcn/ui** - 提供可复用、可定制的 UI 组件
  - Button、Card、Input、Label、Tabs、Textarea、Sheet、Dialog 等
- **Magic UI** - 高级交互组件
  - 动画效果、微交互、视觉增强组件
- **class-variance-authority (CVA)** - 组件变体管理
- **clsx & tailwind-merge** - 样式工具函数

## 🚀 快速开始

### 前置要求

- Node.js 18+
- Python 3.10+
- Docker & Docker Compose
- Git

### 1. 克隆项目

```bash
cd d:\Desktop\amz-auto-ai
```

### 2. 配置 Dify

Dify 已经集成在项目的统一 Docker Compose 配置中，无需单独部署。

#### Dify 环境配置（可选）

Dify 的所有配置都在 `dify/docker/.env` 文件中。如需自定义配置，可以修改该文件：

```env
# Dify API Key（首次启动后从界面获取）
DIFY_API_KEY=your-dify-api-key

# 其他配置项...
```

#### 前端配置

创建 `frontend/.env` 文件：

```env
NEXT_PUBLIC_DIFY_URL=http://localhost:3001
NEXT_PUBLIC_DIFY_API_URL=http://localhost:5001
```

#### 后端配置

在 `backend/app/config.py` 中配置 Dify API 信息：

```python
# Dify 配置
dify_api_key: str = "your-dify-api-key"  # Dify API 密钥（从 Dify 界面获取）
dify_api_url: str = "http://localhost:5001/v1"  # Dify API 地址
dify_frontend_url: str = "http://localhost:3001"  # Dify 前端地址
```

**首次启动后获取 API Key：**
1. 运行 `start.bat` 启动所有服务
2. 打开 http://localhost:3001
3. 注册/登录账号（首次访问需要设置管理员账号）
4. 创建应用
5. 在应用设置中获取 API Key
6. 将 API Key 配置到 `backend/app/config.py` 中

**Dify 部署选项：**

1. **使用集成的 Dify**（推荐）
   - Dify 已集成在 `docker-compose-unified.yml` 中
   - 所有服务在同一个网络中，可以直接互通

2. **使用 Dify Cloud**
   - 注册账号：https://cloud.dify.ai/
   - 在设置中获取 API Key
   - 将 `NEXT_PUBLIC_DIFY_URL` 设置为 `https://cloud.dify.ai`
   - 将 `dify_api_url` 设置为 `https://api.dify.ai/v1`

### 3. 启动所有服务

使用 `start.bat` 启动所有服务：

```bash
# Windows
start.bat

# 或手动启动
docker-compose -f docker-compose-unified.yml up -d
```

这将启动：
- AMZ Auto AI 数据库：
  - PostgreSQL (端口 5433)
  - Redis (端口 6380)
- Dify 服务：
  - Dify PostgreSQL (端口 5434)
  - Dify Redis (端口 6381)
  - Dify API (端口 5001)
  - Dify Web UI (端口 3001)
  - Dify Worker, Sandbox, Plugin Daemon 等

**注意：** 所有服务都在同一个 `amz-network` Docker 网络中，可以相互访问。

### 4. 配置后端环境

编辑 `backend/.env` 文件，设置必要的环境变量：

```env
DATABASE_URL=postgresql://amz_user:amz_password@localhost:5433/amz_auto_ai
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REDIS_URL=redis://localhost:6380/0
DIFY_API_KEY=your-dify-api-key
DIFY_API_URL=http://localhost:5001/v1
DIFY_FRONTEND_URL=http://localhost:3001
```

### 4. 安装 Python 依赖并启动后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境 (Windows)
venv\Scripts\activate

# 激活虚拟环境 (Linux/Mac)
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动后端服务
python run.py
```

后端服务将在 `http://localhost:8000` 启动

API 文档：`http://localhost:8000/docs`

### 5. 安装 Node 依赖并启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将在 `http://localhost:3000` 启动

## 📁 项目结构

```
amz-auto-ai/
├── frontend/                 # Next.js 前端应用
│   ├── app/                # App Router 页面
│   │   ├── auth/          # 认证页面
│   │   │   ├── login/     # 登录页
│   │   │   └── register/  # 注册页
│   │   ├── dashboard/     # 仪表盘
│   │   │   └── workflow/  # 工作流页面
│   │   ├── globals.css    # 全局样式
│   │   ├── layout.tsx     # 根布局
│   │   └── page.tsx       # 首页
│   ├── components/        # React 组件
│   │   ├── ui/           # UI 组件库
│   │   └── Sidebar.tsx   # 侧边栏
│   ├── lib/              # 工具函数
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── next.config.js
│
├── backend/               # FastAPI 后端应用
│   ├── app/
│   │   ├── api/         # API 路由
│   │   │   ├── auth.py  # 认证接口
│   │   │   └── workflows.py # 工作流接口
│   │   ├── schemas/     # Pydantic 模型
│   │   ├── models.py    # SQLAlchemy 模型
│   │   ├── database.py  # 数据库配置
│   │   ├── config.py    # 配置管理
│   │   └── main.py      # FastAPI 应用入口
│   ├── requirements.txt
│   ├── .env
│   └── run.py
│
├── docker-compose.yml    # Docker 编排配置
├── .gitignore
└── README.md
```

## 🔐 功能特性

### 已实现

- ✅ 用户注册和登录
- ✅ JWT 认证
- ✅ 工作流执行界面
- ✅ 工作流历史记录
- ✅ 响应式设计
- ✅ Magic UI 风格动画
- ✅ PostgreSQL 数据持久化
- ✅ Redis 缓存支持
- ✅ Dify API 集成

### 计划中

- 🔄 更多工作流模板
- 🔄 数据可视化
- 🔄 报告导出
- 🔄 用户权限管理
- 🔄 多语言支持

## 🎨 界面预览

### 登录/注册页面
- 渐变背景设计
- 表单验证
- 平滑动画过渡

### 工作流页面
- 左右分栏布局
- 实时输出显示
- 历史记录管理
- 侧边栏导航

## 🔧 开发指南

### 添加新的 API 端点

1. 在 `backend/app/api/` 创建新的路由文件
2. 在 `backend/app/schemas/` 定义请求/响应模型
3. 在 `backend/app/main.py` 注册路由

### 添加新的前端页面

1. 在 `frontend/app/` 创建新页面目录
2. 添加 `page.tsx` 文件
3. 如需布局，添加 `layout.tsx` 文件

### 数据库迁移

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## 🐛 常见问题

### 端口冲突

如果端口被占用，修改以下配置：

- 前端端口：修改 `frontend/package.json` 中的 dev 脚本
- 后端端口：修改 `backend/run.py` 中的端口配置
- 数据库端口：修改 `docker-compose.yml`

### 数据库连接失败

确保 Docker 容器正在运行：

```bash
docker ps
```

检查 PostgreSQL 容器状态：

```bash
docker logs amz-auto-ai-postgres
```

### Dify API 调用失败

1. 检查 `DIFY_API_KEY` 是否正确
2. 确认 `DIFY_API_URL` 格式正确
3. 验证网络连接和 API 可用性

## 📝 环境变量说明

### 后端 (.env)

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| DATABASE_URL | PostgreSQL 连接字符串 | - |
| SECRET_KEY | JWT 密钥 | - |
| ALGORITHM | 加密算法 | HS256 |
| ACCESS_TOKEN_EXPIRE_MINUTES | Token 过期时间 | 30 |
| REDIS_URL | Redis 连接字符串 | redis://localhost:6379/0 |
| DIFY_API_KEY | Dify API 密钥 | - |
| DIFY_API_URL | Dify API 地址 | https://api.dify.ai/v1 |

## 🚢 部署

### 使用 Docker

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 生产环境配置

1. 更改默认的 `SECRET_KEY`
2. 使用环境变量管理敏感信息
3. 配置反向代理（Nginx）
4. 启用 HTTPS
5. 配置日志收集
6. 设置自动备份

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 联系方式

如有问题，请提交 Issue 或联系项目维护者。
