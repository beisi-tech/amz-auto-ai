# Dify 集成说明

## 当前架构

AMZ Auto AI 和 Dify **在同一 Docker 网络中运行**，使用统一的 `docker-compose-unified.yml` 配置文件，确保所有容器可以互相通信。

### 服务端口
- AMZ Auto AI 前端: http://localhost:3000
- AMZ Auto AI 后端: http://localhost:8000
- Dify 界面: http://localhost:3001
- Dify API: http://localhost:5001

### 数据库配置
所有服务都在同一个 `amz-network` 网络中：

- AMZ Auto AI:
  - PostgreSQL: amz-postgres:5432 (外部端口 5433)
  - Redis: amz-redis:6379 (外部端口 6380)

- Dify:
  - PostgreSQL: dify-postgres:5432 (外部端口 5434)
  - Redis: dify-redis:6379 (外部端口 6381)

### 网络配置
- 所有容器都在 `amz-network` 桥接网络中
- 容器之间可以通过服务名互相访问
- AMZ 后端可以通过 `dify-api:5001` 访问 Dify API
- 前端可以通过 `http://localhost:5001` 访问 Dify API

## 使用方式

### 启动所有服务
运行 `start.bat`，会：
1. 启动 AMZ Auto AI 数据库 (PostgreSQL + Redis)
2. 启动 Dify 服务 (API, Worker, Web, 数据库, Redis等)
3. 启动 AMZ Auto AI 后端
4. 启动 AMZ Auto AI 前端

所有服务都在同一个 `amz-network` 网络中，可以直接互通。

### 停止所有服务
运行 `stop.bat`，会：
1. 停止前端和后端服务
2. 停止所有 Docker 容器（AMZ + Dify）

## Dify 配置

### 获取 API Key
1. 打开 http://localhost:3001
2. 注册/登录账号（首次启动时需要设置初始管理员账号）
3. 创建应用或选择现有应用
4. 获取 API Key

### 配置后端

在 `backend/app/config.py` 中配置 Dify 连接信息：

```python
# Dify 配置
dify_api_key: str = "你的-dify-api-key"  # 从 Dify 界面获取
dify_api_url: str = "http://localhost:5001/v1"  # Dify API 地址（从宿主机访问）
dify_frontend_url: str = "http://localhost:3001"  # Dify 前端地址
```

**重要说明：**
- 因为后端在宿主机上运行，所以使用 `localhost` 访问 Dify
- 如果后端也在 Docker 容器中运行，则应该使用 `http://dify-api:5001/v1`（使用容器网络内部地址）

## 服务通信说明

### 容器间通信
所有 Docker 容器（AMZ 和 Dify）都在 `amz-network` 网络中，可以通过服务名互相访问：
- AMZ 后端（如果在容器中）访问 Dify API: `http://dify-api:5001`
- Dify 访问 AMZ 数据库: `postgresql://amz_user:amz_password@amz-postgres:5432/amz_auto_ai`

### 宿主机访问
从宿主机访问各个服务：
- AMZ 前端: http://localhost:3000
- AMZ 后端: http://localhost:8000
- Dify 界面: http://localhost:3001
- Dify API: http://localhost:5001

## 故障排查

### Dify 无法启动
```bash
# 查看容器日志
docker logs amz-auto-ai-dify-api
docker logs amz-auto-ai-dify-postgres
```

### 服务无法连接
```bash
# 检查网络
docker network inspect amz-auto-ai-amz-network

# 检查容器是否在正确的网络中
docker inspect amz-auto-ai-dify-api | grep Networks
```
