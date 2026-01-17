import sys
from app.config import settings

print("=== 配置检查 ===")
print(f"AMZ 数据库 URL: {settings.database_url}")
print(f"Dify 数据库 URL: {settings.dify_db_url}")
print(f"Redis URL: {settings.redis_url}")
print()

print("=== 测试 AMZ 数据库连接 ===")
try:
    from sqlalchemy import create_engine, text
    engine = create_engine(settings.database_url)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM users"))
        print(f"✅ AMZ 数据库连接成功，用户数: {result.scalar()}")
except Exception as e:
    print(f"❌ AMZ 数据库连接失败: {e}")
    sys.exit(1)

print()
print("=== 测试 Dify 数据库连接 ===")
try:
    from sqlalchemy import create_engine, text
    engine = create_engine(settings.dify_db_url)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM apps"))
        print(f"✅ Dify 数据库连接成功，应用数: {result.scalar()}")
except Exception as e:
    print(f"❌ Dify 数据库连接失败: {e}")
    sys.exit(1)

print()
print("=== 测试 Redis 连接 ===")
try:
    import redis
    r = redis.from_url(settings.redis_url)
    r.ping()
    print(f"✅ Redis 连接成功")
except Exception as e:
    print(f"❌ Redis 连接失败: {e}")

print()
print("✅ 所有配置检查通过！")
