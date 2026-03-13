from datetime import datetime, date

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)

    milestones = relationship("Milestone", back_populates="project", cascade="all, delete-orphan")
    updates = relationship("WeeklyUpdate", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("WeeklyReport", back_populates="project", cascade="all, delete-orphan")


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    status = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    sort_order = Column(Integer, nullable=True)

    project = relationship("Project", back_populates="milestones")


class WeeklyUpdate(Base):
    __tablename__ = "weekly_updates"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    user_name = Column(String(100), nullable=False)
    week_start = Column(Date, nullable=False, index=True)

    accomplishments = Column(Text, nullable=True)
    plans_next_week = Column(Text, nullable=True)
    risks_issues = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="updates")


class WeeklyReport(Base):
    __tablename__ = "weekly_reports"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    week_start = Column(Date, nullable=False, index=True)

    draft_text = Column(Text, nullable=False)
    final_text = Column(Text, nullable=True)

    prepared_by = Column(String(100), nullable=True)
    previous_report_id = Column(Integer, ForeignKey("weekly_reports.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    finalized_at = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="reports")
    previous_report = relationship("WeeklyReport", remote_side=[id])

