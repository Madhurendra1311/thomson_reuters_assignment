from __future__ import annotations

from datetime import date
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .llm import generate_weekly_report_text
from . import models, schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Project Update Chat Reporter")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/projects", response_model=List[schemas.Project])
def list_projects(include_milestones: bool = True, db: Session = Depends(get_db)):
    projects = db.query(models.Project).all()
    if not include_milestones:
        for p in projects:
            p.milestones = []
    return projects


@app.post("/projects", response_model=schemas.Project)
def create_project(project_in: schemas.ProjectCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Project).filter(models.Project.name == project_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Project with this name already exists")

    project = models.Project(name=project_in.name, description=project_in.description)
    db.add(project)
    db.flush()

    if project_in.milestones:
        for idx, m in enumerate(project_in.milestones):
            milestone = models.Milestone(
                project_id=project.id,
                title=m.title,
                status=m.status,
                notes=m.notes,
                sort_order=m.sort_order if m.sort_order is not None else idx,
            )
            db.add(milestone)

    db.commit()
    db.refresh(project)
    return project


@app.post("/projects/{project_id}/milestones", response_model=List[schemas.Milestone])
def upsert_milestones(
    project_id: int,
    milestones: List[schemas.MilestoneCreate],
    db: Session = Depends(get_db),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.query(models.Milestone).filter(models.Milestone.project_id == project_id).delete()

    created: List[models.Milestone] = []
    for idx, m in enumerate(milestones):
        milestone = models.Milestone(
            project_id=project_id,
            title=m.title,
            status=m.status,
            notes=m.notes,
            sort_order=m.sort_order if m.sort_order is not None else idx,
        )
        db.add(milestone)
        created.append(milestone)

    db.commit()
    for m in created:
        db.refresh(m)
    return created


@app.post("/updates", response_model=schemas.WeeklyUpdate)
def create_update(update_in: schemas.WeeklyUpdateCreate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == update_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update = models.WeeklyUpdate(**update_in.model_dump())
    db.add(update)
    db.commit()
    db.refresh(update)
    return update


@app.get("/updates", response_model=List[schemas.WeeklyUpdate])
def list_updates(
    project_id: Optional[int] = None,
    week_start: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(models.WeeklyUpdate)
    if project_id is not None:
        query = query.filter(models.WeeklyUpdate.project_id == project_id)
    if week_start is not None:
        query = query.filter(models.WeeklyUpdate.week_start == week_start)
    return query.order_by(models.WeeklyUpdate.created_at.asc()).all()


@app.post("/reports/generate", response_model=schemas.WeeklyReportGenerateResponse)
def generate_weekly_report(
    payload: schemas.WeeklyReportGenerateRequest,
    db: Session = Depends(get_db),
):
    project = db.query(models.Project).filter(models.Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestones = (
        db.query(models.Milestone)
        .filter(models.Milestone.project_id == payload.project_id)
        .all()
    )

    updates = (
        db.query(models.WeeklyUpdate)
        .filter(
            models.WeeklyUpdate.project_id == payload.project_id,
            models.WeeklyUpdate.week_start == payload.week_start,
        )
        .all()
    )

    last_report: Optional[models.WeeklyReport] = (
        db.query(models.WeeklyReport)
        .filter(
            models.WeeklyReport.project_id == payload.project_id,
            models.WeeklyReport.week_start < payload.week_start,
        )
        .order_by(models.WeeklyReport.week_start.desc())
        .first()
    )

    draft_text = generate_weekly_report_text(project, milestones, updates, last_report)

    report = models.WeeklyReport(
        project_id=payload.project_id,
        week_start=payload.week_start,
        draft_text=draft_text,
        final_text=None,
        prepared_by=None,
        previous_report_id=last_report.id if last_report else None,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return schemas.WeeklyReportGenerateResponse(
        report=schemas.WeeklyReport.model_validate(report),
        used_last_week_report=last_report is not None,
    )


@app.post("/reports/finalize", response_model=schemas.WeeklyReport)
def finalize_report(payload: schemas.WeeklyReportFinalize, db: Session = Depends(get_db)):
    report = (
        db.query(models.WeeklyReport)
        .filter(models.WeeklyReport.id == payload.report_id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    from datetime import datetime as _dt

    report.final_text = payload.final_text
    report.finalized_at = _dt.utcnow()
    db.commit()
    db.refresh(report)
    return report


@app.get("/reports", response_model=List[schemas.WeeklyReport])
def list_reports(
    project_id: Optional[int] = None,
    week_start: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(models.WeeklyReport)
    if project_id is not None:
        query = query.filter(models.WeeklyReport.project_id == project_id)
    if week_start is not None:
        query = query.filter(models.WeeklyReport.week_start == week_start)
    return query.order_by(models.WeeklyReport.week_start.asc()).all()

