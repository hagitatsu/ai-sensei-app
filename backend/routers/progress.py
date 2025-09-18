from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from database import get_db
from models import StudentProgress, GameSession, ProblemAttempt

router = APIRouter()

@router.get("/{student_name}")
async def get_student_progress(student_name: str, db: Session = Depends(get_db)):
    """学生の全体的な進捗を取得"""
    progress = db.query(StudentProgress).filter(
        StudentProgress.student_name == student_name
    ).first()

    if not progress:
        # 初回アクセスの場合、新しい進捗記録を作成
        progress = StudentProgress(
            student_name=student_name,
            current_level=1,
            total_problems_solved=0,
            total_stars_earned=0
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)

    # 最近のセッション情報も取得
    recent_sessions = db.query(GameSession).filter(
        GameSession.student_name == student_name
    ).order_by(GameSession.created_at.desc()).limit(5).all()

    return {
        "student_name": progress.student_name,
        "current_level": progress.current_level,
        "total_problems_solved": progress.total_problems_solved,
        "total_stars_earned": progress.total_stars_earned,
        "last_session_at": progress.last_session_at,
        "recent_sessions": [
            {
                "id": session.id,
                "problems_solved": session.problems_solved,
                "stars_earned": session.stars_earned,
                "created_at": session.created_at,
                "completed": session.completed
            }
            for session in recent_sessions
        ]
    }

@router.put("/{student_name}")
async def update_student_progress(
    student_name: str,
    problems_solved: int = None,
    stars_earned: int = None,
    current_level: int = None,
    db: Session = Depends(get_db)
):
    """学生の進捗を更新"""
    progress = db.query(StudentProgress).filter(
        StudentProgress.student_name == student_name
    ).first()

    if not progress:
        raise HTTPException(status_code=404, detail="Student progress not found")

    if problems_solved is not None:
        progress.total_problems_solved += problems_solved
    if stars_earned is not None:
        progress.total_stars_earned += stars_earned
    if current_level is not None:
        progress.current_level = current_level

    from datetime import datetime
    progress.last_session_at = datetime.utcnow()

    db.commit()
    db.refresh(progress)

    return {
        "student_name": progress.student_name,
        "total_problems_solved": progress.total_problems_solved,
        "total_stars_earned": progress.total_stars_earned,
        "current_level": progress.current_level,
        "last_session_at": progress.last_session_at
    }

@router.get("/{student_name}/analytics")
async def get_student_analytics(student_name: str, db: Session = Depends(get_db)):
    """学生の詳細な学習分析を取得"""
    # 基本統計
    total_attempts = db.query(ProblemAttempt).join(GameSession).filter(
        GameSession.student_name == student_name
    ).count()

    correct_attempts = db.query(ProblemAttempt).join(GameSession).filter(
        GameSession.student_name == student_name,
        ProblemAttempt.is_correct == True
    ).count()

    # レベル別統計
    level_stats = db.query(
        GameSession.current_level,
        func.count(ProblemAttempt.id).label('attempts'),
        func.sum(func.cast(ProblemAttempt.is_correct, func.Integer)).label('correct')
    ).join(ProblemAttempt).filter(
        GameSession.student_name == student_name
    ).group_by(GameSession.current_level).all()

    # ヒント使用統計
    avg_hints = db.query(func.avg(ProblemAttempt.hints_used)).join(GameSession).filter(
        GameSession.student_name == student_name
    ).scalar() or 0

    accuracy_rate = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0

    return {
        "student_name": student_name,
        "total_attempts": total_attempts,
        "correct_attempts": correct_attempts,
        "accuracy_rate": round(accuracy_rate, 2),
        "average_hints_used": round(avg_hints, 2),
        "level_statistics": [
            {
                "level": stat.current_level,
                "attempts": stat.attempts,
                "correct": stat.correct or 0,
                "accuracy": round((stat.correct or 0) / stat.attempts * 100, 2) if stat.attempts > 0 else 0
            }
            for stat in level_stats
        ]
    }

@router.get("/{student_name}/recommendations")
async def get_learning_recommendations(student_name: str, db: Session = Depends(get_db)):
    """AI先生からの学習アドバイスを生成"""
    # 最近の成績を分析
    recent_attempts = db.query(ProblemAttempt).join(GameSession).filter(
        GameSession.student_name == student_name
    ).order_by(ProblemAttempt.created_at.desc()).limit(10).all()

    if not recent_attempts:
        return {
            "message": "まずは問題にチャレンジしてみよう！",
            "recommendations": ["たしざんの基礎から始めましょう。"]
        }

    correct_count = sum(1 for attempt in recent_attempts if attempt.is_correct)
    accuracy = correct_count / len(recent_attempts) * 100
    avg_hints = sum(attempt.hints_used for attempt in recent_attempts) / len(recent_attempts)

    # アドバイス生成
    recommendations = []

    if accuracy >= 80:
        message = f"{student_name}くん、とてもよくできているね！"
        recommendations.append("次のレベルにチャレンジしてみよう！")
        recommendations.append("新しい問題タイプも試してみてね。")
    elif accuracy >= 60:
        message = f"{student_name}くん、がんばっているね！"
        recommendations.append("もう少し練習すれば完璧だよ。")
        recommendations.append("ゆっくり考えることを大切にしよう。")
    else:
        message = f"{student_name}くん、だいじょうぶだよ！"
        recommendations.append("ヒントを使いながら練習しよう。")
        recommendations.append("まちがえても気にしないでね。")

    if avg_hints > 3:
        recommendations.append("ヒントに頼りすぎず、自分で考える時間も大切だよ。")

    return {
        "message": message,
        "recommendations": recommendations,
        "current_accuracy": round(accuracy, 1),
        "recent_performance": "excellent" if accuracy >= 80 else "good" if accuracy >= 60 else "needs_practice"
    }
