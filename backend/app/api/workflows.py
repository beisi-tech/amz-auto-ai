from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import httpx
from datetime import datetime

from app.database import get_db
from app.models import User, WorkflowHistory
from app.schemas.workflow import WorkflowCreate, WorkflowResponse, WorkflowRunResponse
from app.api.auth import get_current_user
from app.config import settings
import redis
import json

router = APIRouter()
redis_client = redis.from_url(settings.redis_url)


async def call_dify_api(input_data: str) -> str:
    """调用Dify API执行工作流"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.dify_api_url}/workflows/run",
                headers={
                    "Authorization": f"Bearer {settings.dify_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "inputs": {
                        "query": input_data
                    },
                    "response_mode": "blocking",
                    "user": "amz-user"
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("data", {}).get("outputs", {}).get("text", "工作流执行成功")
            else:
                return f"Dify API返回错误: {response.status_code}"
    except Exception as e:
        return f"调用Dify API时发生错误: {str(e)}"


@router.post("/run", response_model=WorkflowRunResponse)
async def run_workflow(
    workflow: WorkflowCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """执行工作流"""
    try:
        output_data = await call_dify_api(workflow.input_data)
        
        workflow_history = WorkflowHistory(
            user_id=current_user.id,
            name=workflow.name,
            input_data=workflow.input_data,
            output_data=output_data,
            status="completed"
        )
        
        db.add(workflow_history)
        db.commit()
        db.refresh(workflow_history)
        
        return WorkflowRunResponse(
            output_data=output_data,
            status="completed"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"工作流执行失败: {str(e)}"
        )


@router.post("/save", response_model=WorkflowResponse)
async def save_workflow(
    workflow: WorkflowCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """保存工作流结果"""
    try:
        workflow_history = WorkflowHistory(
            user_id=current_user.id,
            name=workflow.name,
            input_data=workflow.input_data,
            output_data=workflow.output_data or "未执行",
            status="saved"
        )
        
        db.add(workflow_history)
        db.commit()
        db.refresh(workflow_history)
        
        return workflow_history
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"保存失败: {str(e)}"
        )


@router.get("/history", response_model=List[WorkflowResponse])
async def get_workflow_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取工作流历史记录"""
    try:
        workflows = db.query(WorkflowHistory).filter(
            WorkflowHistory.user_id == current_user.id
        ).order_by(WorkflowHistory.created_at.desc()).limit(50).all()
        
        return workflows
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取历史记录失败: {str(e)}"
        )


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取特定工作流"""
    workflow = db.query(WorkflowHistory).filter(
        WorkflowHistory.id == workflow_id,
        WorkflowHistory.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="工作流不存在"
        )
    
    return workflow


@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除工作流"""
    workflow = db.query(WorkflowHistory).filter(
        WorkflowHistory.id == workflow_id,
        WorkflowHistory.user_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="工作流不存在"
        )
    
    db.delete(workflow)
    db.commit()
    
    return {"message": "工作流已删除"}
