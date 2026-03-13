from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel


class MilestoneBase(BaseModel):
    title: str
    status: Optional[str] = None
    notes: Optional[str] = None
    sort_order: Optional[int] = None


class MilestoneCreate(MilestoneBase):
    pass


class MilestoneUpdate(MilestoneBase):
    pass


class Milestone(MilestoneBase):
    id: int

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    milestones: Optional[List[MilestoneCreate]] = None


class Project(ProjectBase):
    id: int
    milestones: List[Milestone] = []

    class Config:
        from_attributes = True


class WeeklyUpdateBase(BaseModel):
    project_id: int
    user_name: str
    week_start: date
    accomplishments: Optional[str] = None
    plans_next_week: Optional[str] = None
    risks_issues: Optional[str] = None
    notes: Optional[str] = None


class WeeklyUpdateCreate(WeeklyUpdateBase):
    pass


class WeeklyUpdate(WeeklyUpdateBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class WeeklyReportBase(BaseModel):
    project_id: int
    week_start: date
    draft_text: str
    prepared_by: Optional[str] = None
    previous_report_id: Optional[int] = None


class WeeklyReportCreate(WeeklyReportBase):
    pass


class WeeklyReportFinalize(BaseModel):
    report_id: int
    final_text: str


class WeeklyReport(BaseModel):
    id: int
    project_id: int
    week_start: date
    draft_text: str
    final_text: Optional[str]
    prepared_by: Optional[str]
    previous_report_id: Optional[int]
    created_at: datetime
    finalized_at: Optional[datetime]

    class Config:
        from_attributes = True


class WeeklyReportGenerateRequest(BaseModel):
    project_id: int
    week_start: date


class WeeklyReportGenerateResponse(BaseModel):
    report: WeeklyReport
    used_last_week_report: bool

