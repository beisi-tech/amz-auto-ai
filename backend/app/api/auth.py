import httpx
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from typing import Optional

from app.database import get_db
from app.models import User as UserModel
from app.schemas.user import UserCreate, UserLogin, Token, User
from app.config import settings

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def verify_token_data(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except jwt.JWTError:
        return None


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.JWTError:
        raise credentials_exception

    user = db.query(UserModel).filter(UserModel.email == email).first()
    if user is None:
        raise credentials_exception
    return user


@router.post("/register", response_model=Token)
async def register(user: UserCreate, response: Response, db: Session = Depends(get_db)):
    db_user = db.query(UserModel).filter(UserModel.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    db_user = db.query(UserModel).filter(UserModel.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    hashed_password = get_password_hash(user.password)
    
    # 检查是否为第一个注册用户
    user_count = db.query(UserModel).count()
    is_admin = 1 if user_count == 0 else 0
    
    db_user = UserModel(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        is_admin=is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # 如果是管理员，尝试同步初始化 Dify
    if is_admin == 1:
        try:
            async with httpx.AsyncClient() as client:
                # 1. 调用 Dify 初始化接口
                response = await client.post(
                    f"{settings.dify_base_url}/console/api/setup",
                    json={
                        "email": user.email,
                        "name": user.username,
                        "password": user.password
                    },
                    timeout=10.0
                )
                
                dify_token = None
                
                # 2. 如果初始化成功 (201) 或 已经初始化 (403)，尝试登录获取 Token
                if response.status_code in [200, 201, 403]:
                    if response.status_code == 403:
                        logging.info("Dify already initialized. Attempting login...")
                    else:
                        logging.info("Dify admin initialized successfully")
                    
                    # 登录获取 Dify Token
                    login_res = await client.post(
                        f"{settings.dify_base_url}/console/api/login",
                        json={"email": user.email, "password": user.password},
                        timeout=10.0
                    )
                    
                    if login_res.status_code == 200:
                        dify_token = login_res.json().get("data", {}).get("access_token")
                        logging.info("Dify login successful")
                    else:
                        logging.warning(f"Dify login failed: {login_res.status_code}")
                        
                else:
                    logging.warning(f"Dify init failed: {response.status_code} - {response.text}")
                    # 如果 Dify 初始化失败 (比如密码不符合要求)，我们记录日志，但不阻断 AMZ 注册
                    # 因为用户后续可以在 Dify 界面手动处理

                # 3. 如果获取到了 Token，检查并创建默认工作区
                if dify_token:
                    # 获取工作区列表
                    workspaces_res = await client.get(
                        f"{settings.dify_base_url}/console/api/workspaces",
                        headers={"Authorization": f"Bearer {dify_token}"},
                        timeout=10.0
                    )
                    
                    if workspaces_res.status_code == 200:
                        workspaces = workspaces_res.json().get("workspaces", [])
                        if not workspaces:
                            # 只有当没有工作区时才创建
                            await client.post(
                                f"{settings.dify_base_url}/console/api/workspaces",
                                headers={"Authorization": f"Bearer {dify_token}"},
                                json={"name": "AMZ Workspace"},
                                timeout=10.0
                            )
                            logging.info("Default AMZ Workspace created in Dify")
                        else:
                            logging.info(f"Dify workspaces already exist: {len(workspaces)}")
        except Exception as e:
            logging.error(f"Failed to sync with Dify: {e}")

    access_token = create_access_token(data={"sub": user.email})
    
    # 构造响应数据
    response_data = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": jsonable_encoder(db_user)
    }

    # 使用 JSONResponse 来设置 Cookie 并返回
    response = JSONResponse(content=response_data)
    
    # 设置 SSO Cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=settings.access_token_expire_minutes * 60,
        samesite="lax",
    )
    
    return response


@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == user_credentials.email).first()
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})
    
    # 构造响应数据
    response_data = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": jsonable_encoder(user)
    }

    # 使用 JSONResponse 来设置 Cookie 并返回
    response = JSONResponse(content=response_data)
    
    # 设置 SSO Cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=settings.access_token_expire_minutes * 60,
        samesite="lax",
    )
    
    return response


@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/setup-status")
async def get_setup_status(db: Session = Depends(get_db)):
    user_count = db.query(UserModel).count()
    return {"has_admin": user_count > 0}
