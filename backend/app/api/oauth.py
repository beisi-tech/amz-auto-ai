from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from authlib.jose import jwt, JsonWebKey
from authlib.oauth2.rfc6749 import Grants
from authlib.integrations.starlette_client import OAuth
from datetime import datetime, timedelta
import time
import uuid

from app.database import get_db
from app.config import settings
from app.schemas.user import User
from app.api.auth import get_current_user, authenticate_user, create_access_token

router = APIRouter()

# 简单的 OIDC 配置
OIDC_ISSUER = f"{settings.dify_api_url.replace('/v1', '')}"  # e.g., http://localhost:8000
JWK_KEY = {"kty": "oct", "k": settings.secret_key[:32], "alg": "HS256", "kid": "1"}

@router.get("/.well-known/openid-configuration")
async def openid_configuration():
    base_url = "http://host.docker.internal:8000" # Dify 访问 AMZ 后端的地址
    return {
        "issuer": base_url,
        "authorization_endpoint": f"{base_url}/api/oauth/authorize",
        "token_endpoint": f"{base_url}/api/oauth/token",
        "userinfo_endpoint": f"{base_url}/api/oauth/userinfo",
        "jwks_uri": f"{base_url}/api/oauth/jwks",
        "response_types_supported": ["code"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["HS256"],
    }

@router.get("/oauth/jwks")
async def jwks():
    return {"keys": [JWK_KEY]}

@router.get("/oauth/authorize")
async def authorize(
    response_type: str,
    client_id: str,
    redirect_uri: str,
    scope: str = "openid profile email",
    state: str = None
):
    # 简化版：直接重定向回 Dify，附带一个临时 code
    # 实际生产环境应该显示授权页面，用户点击同意后再跳转
    # 这里为了演示 SSO，假设用户已登录 (实际需要校验 session)
    
    # 生成一个临时 code (在生产环境中应该存储在 Redis 中并关联用户)
    # 这里为了简单，我们把 user_id 编码进 code (极不安全，仅演示)
    # 正常流程：检查 Cookie/Session -> 生成 Auth Code -> Redirect
    
    # 假设默认管理员 (生产环境需改为真实用户认证流程)
    fake_code = f"auth_code_{uuid.uuid4()}"
    
    # 将 code 存入 Redis (TODO: 实现 Redis 存储)
    # redis.set(fake_code, user_id, ex=600)
    
    return RedirectResponse(f"{redirect_uri}?code={fake_code}&state={state}")

from fastapi.responses import RedirectResponse, JSONResponse

@router.post("/oauth/token")
async def token(
    grant_type: str = "authorization_code",
    code: str = None,
    client_id: str = None,
    client_secret: str = None,
    redirect_uri: str = None,
    db: Session = Depends(get_db)
):
    # 验证 Client ID/Secret (Dify 配置的)
    # 验证 Code
    
    # 模拟用户 (管理员)
    user_id = 1 
    user = db.query(User).filter(User.id == user_id).first()
    
    now = int(time.time())
    
    id_token_payload = {
        "iss": "http://host.docker.internal:8000",
        "sub": str(user.id),
        "aud": client_id,
        "exp": now + 3600,
        "iat": now,
        "name": user.username,
        "email": user.email,
    }
    
    id_token = jwt.encode({"alg": "HS256", "kid": "1"}, id_token_payload, JWK_KEY)
    
    return {
        "access_token": create_access_token({"sub": user.username}),
        "token_type": "Bearer",
        "expires_in": 3600,
        "id_token": id_token.decode('utf-8')
    }

@router.get("/oauth/userinfo")
async def userinfo(
    current_user: User = Depends(get_current_user)
):
    return {
        "sub": str(current_user.id),
        "name": current_user.username,
        "email": current_user.email,
        "preferred_username": current_user.username
    }
