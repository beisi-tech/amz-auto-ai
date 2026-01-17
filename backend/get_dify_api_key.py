"""
从 Dify 数据库或 API 获取可用的 API Key
"""
import os
import asyncio
import httpx

# Dify 配置
DIFY_API_URL = "http://localhost:5001/v1"

async def test_api_key(api_key: str) -> bool:
    """测试 API Key 是否有效"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{DIFY_API_URL}/apps",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                timeout=10.0
            )
            if response.status_code == 200:
                print(f"✅ API Key 有效: {api_key[:20]}...")
                return True
            else:
                print(f"❌ API Key 无效 (HTTP {response.status_code})")
                return False
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return False

async def get_dify_apps():
    """尝试使用默认的空 key 获取应用（可能不需要认证）"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{DIFY_API_URL}/apps",
                headers={
                    "Content-Type": "application/json"
                },
                timeout=10.0
            )
            print(f"GET /apps 状态码: {response.status_code}")
            print(f"响应: {response.text[:500]}")
    except Exception as e:
        print(f"获取应用失败: {e}")

async def create_default_app():
    """尝试创建一个默认应用"""
    try:
        async with httpx.AsyncClient() as client:
            # 首先尝试创建一个应用
            response = await client.post(
                f"{DIFY_API_URL}/apps",
                json={
                    "name": "AMZ Auto AI Test App",
                    "description": "Test application",
                    "mode": "workflow"
                },
                headers={
                    "Content-Type": "application/json"
                },
                timeout=10.0
            )
            print(f"POST /apps 状态码: {response.status_code}")
            print(f"响应: {response.text[:500]}")

            if response.status_code == 200:
                data = response.json()
                print(f"\n✅ 应用创建成功!")
                print(f"应用 ID: {data.get('id')}")
                print(f"应用名称: {data.get('name')}")
                return data
    except Exception as e:
        print(f"创建应用失败: {e}")
        return None

async def check_dify_auth():
    """检查 Dify 的认证方式"""
    print("=" * 60)
    print("Dify API 连接检查")
    print("=" * 60)

    # 1. 检查 API 基础连接
    print("\n1. 检查 Dify API 基础连接...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{DIFY_API_URL}/setup",
                timeout=5.0
            )
            print(f"   API 状态: {response.status_code}")
    except Exception as e:
        print(f"   连接失败: {e}")
        return

    # 2. 尝试创建应用
    print("\n2. 尝试创建应用（可能需要认证）...")
    app = await create_default_app()

    if app:
        print("\n✅ Dify 可以连接，但需要配置 API Key")
        print("\n📝 请按以下步骤操作:")
        print("   1. 访问 http://localhost:3001")
        print("   2. 登录或注册账户")
        print("   3. 创建一个应用（工作流）")
        print("   4. 进入应用设置，复制 API Key")
        print("   5. 更新 backend/.env 文件:")
        print("      DIFY_API_KEY=your-actual-api-key")
    else:
        print("\n⚠️  无法直接创建应用，需要用户认证")
        print("\n📝 请按以下步骤操作:")
        print("   1. 访问 http://localhost:3001")
        print("   2. 登录或注册账户")
        print("   3. 创建一个应用（工作流）")
        print("   4. 进入应用设置，复制 API Key")
        print("   5. 更新 backend/.env 文件:")
        print("      DIFY_API_KEY=your-actual-api-key")

if __name__ == "__main__":
    asyncio.run(check_dify_auth())
