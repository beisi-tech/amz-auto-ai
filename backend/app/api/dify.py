from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from typing import Dict, Any, List
import httpx

from app.database import get_db
from app.config import settings
from app.api.auth import get_current_user
from app.schemas.user import User

# 创建 Dify 数据库连接
dify_engine = create_engine(settings.dify_db_url)

router = APIRouter()


def get_dify_apps_from_db() -> List[Dict[str, Any]]:
    """直接从 Dify 数据库读取应用列表"""
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
    except Exception as e:
        print(f"Error reading from Dify DB: {e}")
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

    注意：直接创建的应用可能没有完整的配置
    建议在 Dify UI 创建应用
    """
    try:
        with dify_engine.connect() as conn:
            # 获取第一个 tenant_id
            tenant_result = conn.execute(text("SELECT id FROM tenants LIMIT 1"))
            tenant_row = tenant_result.fetchone()

            if not tenant_row:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Dify 系统未初始化，请在 Dify UI 中先创建账户"
                )

            tenant_id = tenant_row[0]

            # 插入新应用
            result = conn.execute(text("""
                INSERT INTO apps (tenant_id, name, description, mode, status, created_at, updated_at)
                VALUES (:tenant_id, :name, :description, :mode, 'normal', NOW(), NOW())
                RETURNING id, name, description, mode, created_at, updated_at
            """), {
                "tenant_id": tenant_id,
                "name": app_data.get("name", "新应用"),
                "description": app_data.get("description", ""),
                "mode": app_data.get("mode", "workflow")
            })

            new_app = result.fetchone()
            conn.commit()

            return {
                "id": str(new_app.id),
                "name": new_app.name,
                "description": new_app.description,
                "mode": new_app.mode,
                "created_at": new_app.created_at.isoformat(),
                "updated_at": new_app.updated_at.isoformat()
            }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建 Dify 应用失败: {str(e)}"
        )
