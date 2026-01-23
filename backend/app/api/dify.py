from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError, DatabaseError
from typing import Dict, Any, List
import httpx
import logging

from app.database import get_db
from app.config import settings
from app.api.auth import get_current_user
from app.schemas.user import User

# 配置日志
logger = logging.getLogger(__name__)

# 创建 Dify 数据库连接 (仅用于读取列表，保持高性能)
try:
    dify_engine = create_engine(settings.dify_db_url, pool_pre_ping=True)
except Exception as e:
    logger.error(f"创建 Dify 数据库连接失败: {e}")
    dify_engine = None

router = APIRouter()


async def get_dify_admin_token() -> str:
    """
    获取 Dify 管理员 Token (用于调用 Console API)
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.dify_base_url}/console/api/login",
                json={
                    "email": settings.dify_admin_email,
                    "password": settings.dify_admin_password,
                    "provider": "email"
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"Dify 登录失败: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="无法认证 Dify 管理员账户"
                )
                
            data = response.json()
            return data.get("data", {}).get("access_token")
    except httpx.RequestError as e:
        logger.error(f"Dify 连接失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="无法连接到 Dify 服务"
        )


def get_dify_apps_from_db() -> List[Dict[str, Any]]:
    """直接从 Dify 数据库读取应用列表"""
    if dify_engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Dify 数据库连接未初始化"
        )
    
    try:
        with dify_engine.connect() as conn:
            result = conn.execute(text("""
                SELECT
                    id,
                    name,
                    mode,
                    description,
                    status,
                    icon,
                    created_at,
                    updated_at
                FROM apps
                ORDER BY created_at DESC
            """))

            apps = []
            for row in result:
                apps.append({
                    "id": str(row.id),
                    "name": row.name,
                    "mode": row.mode,
                    "description": row.description,
                    "status": row.status,
                    "icon": row.icon,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                    "updated_at": row.updated_at.isoformat() if row.updated_at else None,
                })
            return apps
    except (OperationalError, DatabaseError) as e:
        logger.error(f"数据库操作失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="无法连接到 Dify 数据库，请确保 Dify 服务正在运行"
        )
    except Exception as e:
        logger.error(f"读取 Dify 应用时出错: {e}")
        return []


@router.get("/dify/test")
async def test_dify_connection():
    """
    测试 Dify 数据库连接（临时测试端点，不需要认证）
    """
    try:
        apps = get_dify_apps_from_db()
        return {
            "status": "success",
            "count": len(apps),
            "apps": apps
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"测试失败: {str(e)}"
        )


@router.get("/dify/apps")
async def get_dify_apps(
    current_user: User = Depends(get_current_user)
):
    """
    获取 Dify 应用列表（直接从数据库读取）
    """
    try:
        apps = get_dify_apps_from_db()
        return {"apps": apps}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取 Dify 应用失败: {str(e)}"
        )


@router.get("/dify/apps/{app_id}")
async def get_dify_app(
    app_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    获取单个 Dify 应用详情
    """
    try:
        async with httpx.AsyncClient() as client:
            # 尝试使用 API Key 访问 (Service API)
            response = await client.get(
                f"{settings.dify_api_url}/apps/{app_id}",
                headers={
                    "Authorization": f"Bearer {settings.dify_api_key}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            # 如果 Service API 失败，可能需要使用 Console API (TODO: 完善 Console API 读取)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        # 如果是 404，可能是 API Key 权限问题或 App 不存在
        # 降级：从数据库读取基本信息
        if e.response.status_code == 404:
             with dify_engine.connect() as conn:
                result = conn.execute(text("SELECT * FROM apps WHERE id = :id"), {"id": app_id})
                row = result.fetchone()
                if row:
                    return {
                        "id": str(row.id),
                        "name": row.name,
                        "mode": row.mode,
                        "description": row.description
                    }
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dify API 错误: {e.response.text if e.response else str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取 Dify 应用失败: {str(e)}"
        )


@router.post("/dify/apps/{app_id}/run")
async def run_dify_app(
    app_id: str,
    inputs: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    运行 Dify 应用
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.dify_api_url}/apps/{app_id}/run",
                json={"inputs": inputs},
                headers={
                    "Authorization": f"Bearer {settings.dify_api_key}",
                    "Content-Type": "application/json"
                },
                timeout=60.0
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dify API 错误: {e.response.text if e.response else str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"运行 Dify 应用失败: {str(e)}"
        )


@router.post("/dify/apps")
async def create_dify_app(
    app_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    创建 Dify 应用（通过 Dify Console API）
    
    不再直接操作数据库，而是模拟管理员登录调用 Dify API 创建应用
    """
    try:
        # 1. 获取管理员 Token
        token = await get_dify_admin_token()
        
        # 2. 准备数据
        payload = {
            "name": app_data.get("name", "新应用"),
            "description": app_data.get("description", ""),
            "mode": app_data.get("mode", "workflow"),
            "icon": app_data.get("icon", "🤖"),
            "icon_background": app_data.get("icon_background", "#3B82F6")
        }
        
        # 3. 调用 Dify Console API 创建应用
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.dify_base_url}/console/api/apps",
                json=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            
            if response.status_code == 201 or response.status_code == 200:
                return response.json()
            else:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = error_json.get("message", error_detail)
                except:
                    pass
                    
                logger.error(f"Dify 创建应用失败: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Dify 创建应用失败: {error_detail}"
                )

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"创建应用未知错误: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"系统内部错误: {str(e)}"
        )
