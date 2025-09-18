from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import random

from database import get_db
from models import Problem, ProblemAttempt

router = APIRouter()

@router.get("/generate")
async def generate_problem(level: int = 1):
    """指定レベルの問題を生成"""
    if level < 1 or level > 3:
        raise HTTPException(status_code=400, detail="Level must be between 1 and 3")

    # レベル別問題生成ロジック
    if level == 1:  # 1-5 + 1-5
        num1 = random.randint(1, 5)
        num2 = random.randint(1, 5)
    elif level == 2:  # 1-10 + 1-5
        num1 = random.randint(1, 10)
        num2 = random.randint(1, 5)
    else:  # level == 3: 1-10 + 1-10
        num1 = random.randint(1, 10)
        num2 = random.randint(1, 10)

    answer = num1 + num2

    return {
        "id": random.randint(10000, 99999),  # 一時的なID
        "num1": num1,
        "num2": num2,
        "answer": answer,
        "level": level,
        "category": "addition"
    }

@router.post("/submit")
async def submit_answer(
    problem_id: int,
    session_id: int,
    student_answer: int,
    correct_answer: int,
    hints_used: int = 0,
    time_taken: int = 0,
    db: Session = Depends(get_db)
):
    """解答を提出して採点"""
    is_correct = student_answer == correct_answer

    # 解答履歴を保存
    attempt = ProblemAttempt(
        session_id=session_id,
        problem_id=problem_id,
        student_answer=student_answer,
        is_correct=is_correct,
        hints_used=hints_used,
        time_taken=time_taken
    )
    db.add(attempt)
    db.commit()

    # AI先生からのフィードバック
    if is_correct:
        feedback_messages = [
            "せいかい！とてもよくできたね！",
            "すばらしい！がんばったね！",
            "やったね！せいかいだよ！",
            "すごい！かしこいね！"
        ]
    else:
        feedback_messages = [
            "ちがうね。でも、だいじょうぶだよ！",
            "まちがえちゃった。もういちどがんばろう！",
            "そうじゃないね。ヒントをみてみよう！",
            "おしい！もうすこしかんがえてみて！"
        ]

    feedback = random.choice(feedback_messages)

    return {
        "is_correct": is_correct,
        "feedback": feedback,
        "stars_earned": 1 if is_correct else 0,
        "attempt_id": attempt.id
    }

@router.get("/hints/{num1}/{num2}")
async def get_hints(num1: int, num2: int):
    """段階的ヒントを生成"""
    answer = num1 + num2

    hints = [
        {
            "level": 1,
            "content": f"{num1}と{num2}をたしてみよう！",
            "visual": None
        },
        {
            "level": 2,
            "content": f"{num1}からかぞえてみよう。",
            "visual": f"{num1}から：" + ", ".join([str(num1 + i + 1) for i in range(num2)])
        },
        {
            "level": 3,
            "content": "ゆびでかぞえてみよう！",
            "visual": f"👆 {'🟡' * num1} + {'🔵' * num2}"
        },
        {
            "level": 4,
            "content": "ぜんぶでいくつかな？",
            "visual": f"{'●' * num1} + {'●' * num2} = {'●' * answer}"
        },
        {
            "level": 5,
            "content": f"こたえは{answer}だよ！",
            "visual": f"{num1} + {num2} = {answer}"
        }
    ]

    return {"hints": hints}

@router.get("/statistics")
async def get_problem_statistics(db: Session = Depends(get_db)):
    """問題解答統計を取得"""
    total_attempts = db.query(ProblemAttempt).count()
    correct_attempts = db.query(ProblemAttempt).filter(ProblemAttempt.is_correct == True).count()

    accuracy_rate = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0

    return {
        "total_attempts": total_attempts,
        "correct_attempts": correct_attempts,
        "accuracy_rate": round(accuracy_rate, 2)
    }
