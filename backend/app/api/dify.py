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

# 创建 Dify 数据库连接
try:
    dify_engine = create_engine(settings.dify_db_url, pool_pre_ping=True)
except Exception as e:
    logger.error(f"创建 Dify 数据库连接失败: {e}")
    dify_engine = None

router = APIRouter()


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
            response = await client.get(
                f"{settings.dify_api_url}/apps/{app_id}",
                headers={
                    "Authorization": f"Bearer {settings.dify_api_key}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
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
            detail=f"获取 Dify 应用失败: {str(e)}"
        )


@router.get("/dify/apps/{app_id}/workflow")
async def get_dify_app_workflow(
    app_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    获取 Dify 应用的工作流详情
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.dify_api_url}/apps/{app_id}/workflows",
                headers={
                    "Authorization": f"Bearer {settings.dify_api_key}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
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
            detail=f"获取 Dify 工作流失败: {str(e)}"
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
    创建 Dify 应用（直接写入数据库）
    
    创建完整的工作流应用，包括必要的配置
    """
    if dify_engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Dify 数据库连接未初始化，请检查配置"
        )
    
    try:
        import uuid
        from datetime import datetime
        
        with dify_engine.begin() as conn:
            # 获取第一个 tenant_id
            tenant_result = conn.execute(text("SELECT id FROM tenants LIMIT 1"))
            tenant_row = tenant_result.fetchone()

            if not tenant_row:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Dify 系统未初始化，请在 Dify UI 中先创建账户"
                )

            tenant_id = tenant_row[0]
            
            # 生成唯一ID
            app_id = str(uuid.uuid4())
            now = datetime.utcnow()
            
            # 获取第一个账户ID
            account_result = conn.execute(text("SELECT id FROM accounts LIMIT 1"))
            account_row = account_result.fetchone()
            
            if not account_row:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="未找到账户，请先在 Dify UI 中创建账户"
                )
            
            created_by = account_row[0]
            
            # 准备应用数据
            name = app_data.get("name", "新工作流")
            description = app_data.get("description", "")
            mode = app_data.get("mode", "workflow")
            icon = app_data.get("icon", "🤖")
            icon_background = app_data.get("icon_background", "#3B82F6")
            
            # 插入应用记录
            conn.execute(text("""
                INSERT INTO apps (
                    id, tenant_id, name, description, mode, icon, icon_background,
                    status, enable_site, enable_api, api_rpm, api_rph,
                    is_demo, is_public, created_by, created_at, updated_by, updated_at
                )
                VALUES (
                    :id, :tenant_id, :name, :description, :mode, :icon, :icon_background,
                    'normal', false, true, 60, 3600,
                    false, false, :created_by, :created_at, :created_by, :updated_at
                )
            """), {
                "id": app_id,
                "tenant_id": tenant_id,
                "name": name,
                "description": description,
                "mode": mode,
                "icon": icon,
                "icon_background": icon_background,
                "created_by": created_by,
                "created_at": now,
                "updated_at": now
            })
            
            # 为工作流模式创建默认配置
            if mode == "workflow":
                # 创建基本的工作流配置
                workflow_config = {
                    "nodes": [],
                    "edges": [],
                    "viewport": {"x": 0, "y": 0, "zoom": 1}
                }
                
                conn.execute(text("""
                    INSERT INTO app_model_configs (
                        id, app_id, provider, model_id, configs, created_at, updated_at
                    )
                    VALUES (
                        :id, :app_id, '', '', '{}', :created_at, :updated_at
                    )
                """), {
                    "id": str(uuid.uuid4()),
                    "app_id": app_id,
                    "created_at": now,
                    "updated_at": now
                })

            # 获取创建的应用
            result = conn.execute(text("""
                SELECT id, name, description, mode, icon, icon_background, created_at, updated_at
                FROM apps
                WHERE id = :app_id
            """), {"app_id": app_id})

            new_app = result.fetchone()

            return {
                "id": str(new_app.id),
                "name": new_app.name,
                "description": new_app.description,
                "mode": new_app.mode,
                "icon": new_app.icon,
                "icon_background": new_app.icon_background,
                "created_at": new_app.created_at.isoformat(),
                "updated_at": new_app.updated_at.isoformat()
            }
    except Exception as e:
        import traceback
        print(f"创建应用错误详情: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建 Dify 应用失败: {str(e)}"
        )
