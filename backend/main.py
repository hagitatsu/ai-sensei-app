from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import random

from database import get_db, init_db
from models import Problem, StudentProgress, GameSession
from routers import problems, progress

app = FastAPI(
    title="AI先生 Backend API",
    description="小学1年生算数（たしざん）個別指導システム",
    version="1.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では具体的なドメインを指定
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# データベース初期化
init_db()

# ルーター登録
app.include_router(problems.router, prefix="/api/v1/problems", tags=["problems"])
app.include_router(progress.router, prefix="/api/v1/progress", tags=["progress"])

@app.get("/")
async def root():
    return {
        "message": "AI先生 Backend API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-sensei-backend"}

@app.post("/api/v1/sessions")
async def create_session(
    student_name: str,
    db: Session = Depends(get_db)
):
    """新しいゲームセッションを作成"""
    try:
        session = GameSession(
            student_name=student_name,
            current_level=1,
            problems_solved=0,
            stars_earned=0
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        return {
            "session_id": session.id,
            "student_name": session.student_name,
            "current_level": session.current_level
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/sessions/{session_id}")
async def get_session(
    session_id: int,
    db: Session = Depends(get_db)
):
    """セッション情報を取得"""
    session = db.query(GameSession).filter(GameSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": session.id,
        "student_name": session.student_name,
        "current_level": session.current_level,
        "problems_solved": session.problems_solved,
        "stars_earned": session.stars_earned,
        "created_at": session.created_at
    }

@app.put("/api/v1/sessions/{session_id}")
async def update_session(
    session_id: int,
    problems_solved: Optional[int] = None,
    stars_earned: Optional[int] = None,
    current_level: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """セッション情報を更新"""
    session = db.query(GameSession).filter(GameSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if problems_solved is not None:
        session.problems_solved = problems_solved
    if stars_earned is not None:
        session.stars_earned = stars_earned
    if current_level is not None:
        session.current_level = current_level

    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "problems_solved": session.problems_solved,
        "stars_earned": session.stars_earned,
        "current_level": session.current_level
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
