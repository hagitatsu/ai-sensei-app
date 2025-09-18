import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

# データベース設定
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ai_sensei.db")

# SQLiteの場合、接続エンジンの設定
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQLの場合
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """データベースとテーブルを初期化"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """データベースセッションの依存性注入"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
