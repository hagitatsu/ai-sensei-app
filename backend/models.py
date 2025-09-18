from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Problem(Base):
    """算数問題テーブル"""
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    num1 = Column(Integer, nullable=False)
    num2 = Column(Integer, nullable=False)
    answer = Column(Integer, nullable=False)
    level = Column(Integer, nullable=False, default=1)
    category = Column(String, default="addition")
    created_at = Column(DateTime, default=datetime.utcnow)

class StudentProgress(Base):
    """学習進捗テーブル"""
    __tablename__ = "student_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_name = Column(String, nullable=False)
    current_level = Column(Integer, default=1)
    total_problems_solved = Column(Integer, default=0)
    total_stars_earned = Column(Integer, default=0)
    last_session_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

class GameSession(Base):
    """ゲームセッションテーブル"""
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_name = Column(String, nullable=False)
    current_level = Column(Integer, default=1)
    problems_solved = Column(Integer, default=0)
    stars_earned = Column(Integer, default=0)
    session_duration = Column(Integer, default=0)  # 秒単位
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ProblemAttempt(Base):
    """問題解答履歴テーブル"""
    __tablename__ = "problem_attempts"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("game_sessions.id"))
    problem_id = Column(Integer, ForeignKey("problems.id"))
    student_answer = Column(Integer)
    is_correct = Column(Boolean)
    hints_used = Column(Integer, default=0)
    time_taken = Column(Integer)  # 秒単位
    created_at = Column(DateTime, default=datetime.utcnow)

    # リレーション
    session = relationship("GameSession")
    problem = relationship("Problem")
