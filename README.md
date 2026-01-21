# AMZ Auto AI - 电商优化工具

AI驱动的亚马逊电商优化工具，基于用户评价、图片和市场数据自动优化产品列表。

## 🌟 特性

- 🤖 **Dify AI 集成** - 集成 Dify AI 平台，使用原生工作流编辑器
- ✨ **一键创建工作流** - 直接在前端创建 Dify 工作流，无需跳转
- 📊 **应用管理** - 集中管理所有 Dify AI 应用
- 🔐 **安全认证** - JWT 用户认证系统
- 🎨 **现代 UI** - Magic UI 风格动画，流畅的用户体验
- 📱 **响应式设计** - 支持桌面和移动设备
- ⚡ **高性能** - Redis 缓存 + PostgreSQL 持久化
- 🛡️ **管理员后台** - 系统管理与监控

## 🚀 快速开始

### 准备工作

1. 确保已安装 Docker Desktop 并正在运行
2. 确保已安装 Node.js (18+) 和 Python (3.9+)
3. 运行环境检查脚本：

```bash
check_setup.bat
```

### Windows 用户（推荐）

**启动所有服务：**

```bash
start.bat
```

**停止所有服务：**

```bash
stop.bat
```

### 初次使用

1. 启动服务后，访问 http://localhost:3001 初始化 Dify
2. 在 Dify 中注册账户并完成设置
3. 访问 http://localhost:3000 使用前端应用
4. 登录并进入"工作流管理"页面
5. 点击"创建"按钮，填写表单即可创建新工作流

### 手动启动

#### 1. 启动数据库和 Dify

```bash
docker-compose -f docker-compose-unified.yml up -d
```

#### 2. 配置后端

编辑 `backend/.env` 文件：

```env
DATABASE_URL=postgresql://amz_user:amz_password@localhost:5433/amz_auto_ai
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REDIS_URL=redis://localhost:6379/0
DIFY_API_KEY=your-dify-api-key
DIFY_API_URL=http://localhost:5001/v1
DIFY_DB_URL=postgresql+psycopg2://postgres:difyai123456@localhost:5434/dify
```
DIFY_FRONTEND_URL=http://localhost:3001
```

#### 3. 启动后端

```bash
cd backend
pip install -r requirements.txt
python run.py
```

后端服务将在 `http://localhost:8000` 启动

#### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 `http://localhost:3000` 启动

## 📖 使用说明

### Dify 工作流管理

1. **配置 Dify**
   - 确保 Dify 服务已启动（运行 start.bat）
   - 访问 http://localhost:3001 完成 Dify 初始化
   - Dify 数据库连接会自动配置

2. **注册账户** - 访问 http://localhost:3000/auth/register

3. **登录系统** - 使用注册的邮箱和密码登录

4. **创建工作流** ✨ 新功能
   - 进入"工作流管理"页面
   - 点击右上角"创建"按钮
   - 填写应用名称、描述和类型
   - 点击"创建"，系统会自动：
     * 在 Dify 数据库中创建应用
     * 刷新应用列表
     * 打开 Dify 编辑器（新标签页）
   - 在 Dify 编辑器中配置工作流节点

5. **管理应用**
   - 查看所有 Dify 应用列表
   - 点击应用卡片打开编辑器
   - 使用下拉菜单访问更多选项

## 📂 项目结构

```
amz-auto-ai/
├── frontend/                    # Next.js 前端应用
│   ├── app/                    # 页面和路由
│   │   ├── auth/              # 认证页面
│   │   ├── dashboard/         # 仪表盘、工作流、设置
│   │   │   └── workflow/      # ✨ 工作流管理页面（已更新）
│   │   └── ...
│   ├── components/            # React 组件
│   │   ├── ui/               # UI 组件库
│   │   │   ├── select.tsx    # ✨ 新增选择器组件
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── ...
│   │   ├── magic/            # Magic UI 组件
│   │   └── TopNav.tsx
│   └── lib/
│       └── utils.ts          # ✨ 工具函数
├── backend/                   # FastAPI 后端应用
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── dify.py       # ✨ 增强的 Dify 集成（已更新）
│   │   │   ├── admin.py
│   │   │   └── ...
│   │   └── ...
│   └── .env
├── dify/                      # Dify 集成
├── docker-compose-unified.yml # 统一的 Docker 配置
├── start.bat                  # 一键启动脚本
├── stop.bat                   # 一键停止脚本
├── check_setup.bat            # ✨ 环境检查脚本（新增）
├── test_workflow_integration.py # ✨ 集成测试脚本（新增）
├── DIFY_INTEGRATION.md        # Dify 架构说明
├── DIFY_WORKFLOW_INTEGRATION.md # ✨ 工作流集成详细说明（新增）
└── QUICK_START_WORKFLOW.md   # ✨ 快速启动指南（新增）
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| DATABASE_URL | PostgreSQL 连接字符串 | - |
| SECRET_KEY | JWT 密钥 | - |
| DIFY_API_KEY | Dify API 密钥 | - |
| DIFY_DB_URL | Dify 数据库连接 | postgresql+psycopg2://postgres:difyai123456@localhost:5434/dify |
| DIFY_API_URL | Dify API 地址 | http://localhost:5001/v1 |
| DIFY_FRONTEND_URL | Dify 前端地址 | http://localhost:3001 |

## 📊 服务端口

- AMZ Auto AI 前端: http://localhost:3000
- AMZ Auto AI 后端: http://localhost:8000
- Dify 界面: http://localhost:3001
- Dify API: http://localhost:5001
- PostgreSQL: localhost:5433
- Redis: localhost:6379

## 🔐 安全性

- 密码使用 bcrypt 加密存储
- JWT Token 认证
- CORS 配置
- SQL 注入防护 (ORM)
- XSS 防护 (React)

## 📝 功能列表

### 已实现
- ✅ 用户注册和登录
- ✅ JWT 认证系统
- ✅ 工作流管理界面
- ✅ Dify 完整集成
- ✅ **一键创建工作流** ✨
- ✅ **应用列表自动同步** ✨
- ✅ **美观的创建对话框** ✨
- ✅ **实时表单验证** ✨
- ✅ 管理员后台
- ✅ 响应式设计
- ✅ 深色模式支持

### 待开发
- 🔄 工作流模板库
- 🔄 批量操作功能
- 🔄 应用搜索和过滤
- 🔄 使用统计和分析
- 🔄 应用分享功能
- 🔄 内联编辑
- 🔄 拖拽排序
- 🔄 更多工作流模板
- 🔄 数据可视化
- 🔄 报告导出
- 🔄 用户权限管理
- 🔄 多语言支持

## 🆕 最新更新（v0.2.0）

### ✨ 工作流创建功能增强
- **前端直接创建**：无需跳转到 Dify，在本系统直接创建工作流
- **美观的 UI**：使用 Radix UI 组件，提供现代化的创建体验
- **实时验证**：表单字段实时验证，防止错误提交
- **自动刷新**：创建成功后自动刷新列表并可选打开编辑器
- **错误处理**：完善的错误提示和日志记录

### 🔧 技术改进
- 增强的数据库连接管理（连接池、错误重试）
- 完善的日志系统
- 更好的错误处理和用户反馈
- 新增环境检查脚本
- 新增集成测试脚本

### 📚 文档更新
- 新增 `DIFY_WORKFLOW_INTEGRATION.md` - 详细的集成说明
- 新增 `QUICK_START_WORKFLOW.md` - 快速启动指南
- 更新 `README.md` - 包含最新功能说明
- 新增 `check_setup.bat` - 环境检查工具

## 🐛 常见问题

### 端口冲突

修改以下配置：
- 前端端口：`frontend/package.json`
- 后端端口：`backend/run.py`
- 数据库端口：`docker-compose-unified.yml`

### 数据库连接失败

```bash
docker ps
docker logs amz-auto-ai-dify-postgres
```

### 创建工作流失败

1. 确保 Dify 服务正在运行
2. 访问 http://localhost:3001 完成初始化
3. 在 Dify 中至少创建一个账户
4. 检查 `backend/.env` 中的 `DIFY_DB_URL` 配置

### 前端依赖安装失败

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```
```

### Dify API 调用失败

1. 检查 `DIFY_API_KEY` 是否正确
2. 确认 `DIFY_API_URL` 格式正确
3. 验证网络连接

## 📄 许可证

MIT License

## 📞 联系

如有问题或建议，请提交 Issue。
