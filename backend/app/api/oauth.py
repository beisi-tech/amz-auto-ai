import time
import uuid
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from authlib.jose import jwt, JsonWebKey
# from authlib.oauth2.rfc6749 import Grants  # Removed unused import causing error
from authlib.integrations.starlette_client import OAuth

from app.database import get_db
from app.config import settings
from app.schemas.user import User
from app.models import User as UserModel # Import UserModel
from app.api.auth import get_current_user, create_access_token, verify_token_data

router = APIRouter()

# 简单的内存 Code 存储 (生产环境请使用 Redis)
AUTH_CODES: Dict[str, dict] = {}

# 简单的 OIDC 配置
OIDC_ISSUER = f"{settings.dify_api_url.replace('/v1', '')}"  # e.g., http://localhost:8000
JWK_KEY = {"kty": "oct", "k": settings.secret_key[:32], "alg": "HS256", "kid": "1"}

@router.get("/.well-known/openid-configuration")
async def openid_configuration():
    print("SSO: Dify requested openid-configuration")
    # 容器内访问地址 (Dify 后端使用)
    internal_base_url = "http://host.docker.internal:8800"
    # 浏览器访问地址 (用户浏览器使用)
    external_base_url = "http://localhost:8800"
    
    return {
        "issuer": internal_base_url,
        "authorization_endpoint": f"{external_base_url}/api/oauth/authorize",
        "token_endpoint": f"{internal_base_url}/api/oauth/token",
        "userinfo_endpoint": f"{internal_base_url}/api/oauth/userinfo",
        "jwks_uri": f"{internal_base_url}/api/oauth/jwks",
        "response_types_supported": ["code"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["HS256"],
    }

@router.get("/oauth/jwks")
async def jwks():
    print("SSO: JWKS requested")
    return {"keys": [JWK_KEY]}

@router.get("/oauth/authorize")
async def authorize(
    request: Request,
    response_type: str,
    client_id: str,
    redirect_uri: str,
    scope: str = "openid profile email",
    state: str = None,
    db: Session = Depends(get_db)
):
    print(f"SSO Authorize Request: redirect_uri={redirect_uri}")
    # 1. 尝试从 Cookie 中获取 access_token
    token = request.cookies.get("access_token")
    user = None
    
    if token:
        # 处理 "Bearer <token>" 格式
        if token.startswith("Bearer "):
            token = token.split(" ")[1]
        
        try:
            # 验证 Token 并获取用户信息
            # 注意：这里需要引入 verify_token_data 或类似逻辑
            # 为简单起见，我们假设 auth.py 中有类似逻辑，或者直接解码
            from jose import jwt as jose_jwt
            payload = jose_jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            email = payload.get("sub")
            if email:
                user = db.query(UserModel).filter(UserModel.email == email).first()
        except Exception as e:
            print(f"Token validation failed: {e}")
            pass

    # 2. 如果用户未登录，重定向到前端登录页
    if not user:
        print("SSO: User not logged in, redirecting to login page")
        # 登录成功后，前端应该重定向回这个 URL (request.url)
        # 关键修复：确保 redirect 参数被 URL 编码，否则可能被前端截断
        import urllib.parse
        # 注意：这里需要对整个 url 进行 quote，因为它是作为参数传递的
        target_url = str(request.url)
        encoded_redirect = urllib.parse.quote(target_url, safe='')
        login_url = f"http://localhost:4070/auth/login?redirect={encoded_redirect}"
        return RedirectResponse(login_url)

    # 3. 用户已登录，生成授权码
    auth_code = f"code_{uuid.uuid4()}"
    
    # 存入内存 (有效期 10 分钟)
    AUTH_CODES[auth_code] = {
        "user_id": user.id,
        "expires_at": time.time() + 600,
        "scope": scope,
        "nonce": None # 如果 URL 中有 nonce 也应该存下来
    }
    
    # 4. 重定向回 Dify (带上 code 和 state)
    redirect_to = f"{redirect_uri}?code={auth_code}"
    if state:
        redirect_to += f"&state={state}"
        
    print(f"SSO: Redirecting back to Dify: {redirect_to}")
    return RedirectResponse(redirect_to)

from fastapi.responses import RedirectResponse, JSONResponse

@router.post("/oauth/token")
async def token(
    request: Request,
    db: Session = Depends(get_db)
):
    # 获取表单数据
    form = await request.form()
    grant_type = form.get("grant_type")
    code = form.get("code")
    client_id = form.get("client_id")
    client_secret = form.get("client_secret")
    redirect_uri = form.get("redirect_uri")

    if grant_type != "authorization_code":
        raise HTTPException(status_code=400, detail="Invalid grant_type")
        
    print(f"SSO: Token exchange - Code: {code}")
    # 验证 Code
    code_data = AUTH_CODES.get(code)
    if not code_data:
        print(f"SSO Token: Invalid code {code}")
        raise HTTPException(status_code=400, detail="Invalid or expired code")
        
    if code_data["expires_at"] < time.time():
        del AUTH_CODES[code]
        raise HTTPException(status_code=400, detail="Code expired")
        
    # 获取用户
    user_id = code_data["user_id"]
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
        
    # 消费 Code (只能用一次)
    del AUTH_CODES[code]
    
    now = int(time.time())
    
    id_token_payload = {
        # 必须与 Dify 配置的 OIDC_ISSUER 严格一致
        "iss": "http://host.docker.internal:8800",
        "sub": str(user.id),
        "aud": client_id,
        "exp": now + 3600,
        "iat": now,
        "name": user.username,
        "email": user.email,
        "preferred_username": user.username
    }
    
    id_token = jwt.encode({"alg": "HS256", "kid": "1"}, id_token_payload, JWK_KEY)
    
    print("SSO: Token generated successfully")
    return {
        "access_token": create_access_token({"sub": user.email}),
        "token_type": "Bearer",
        "expires_in": 3600,
        "id_token": id_token.decode('utf-8')
    }

@router.get("/oauth/userinfo")
async def userinfo(
    current_user: User = Depends(get_current_user)
):
    # Dify 期望的完整字段
    return {
        "sub": str(current_user.id),
        "name": current_user.username,
        "email": current_user.email,
        "preferred_username": current_user.username,
        "picture": "", # 可选：用户头像 URL
        "profile": "", # 可选：用户资料 URL
        "email_verified": True,
        # 关键：Dify 前端可能会读取这个字段来设置语言
        "interface_language": "en-US", 
        "interface_theme": "light"
    }
