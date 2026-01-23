from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, workflows, dify, admin, oauth
from app.database import engine, Base

app = FastAPI(title="AMZ Auto AI API", version="1.0.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(workflows.router, prefix="/api/workflows", tags=["workflows"])
app.include_router(dify.router, prefix="/api", tags=["dify"])
app.include_router(admin.router, prefix="/api", tags=["admin"])
app.include_router(oauth.router, prefix="/api", tags=["oauth"])



@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)


@app.get("/")
async def root():
    return {"message": "AMZ Auto AI API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
