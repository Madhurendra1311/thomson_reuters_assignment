from datetime import date, timedelta

from sqlalchemy.orm import Session

from .database import SessionLocal, engine, Base
from . import models


def seed():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    if db.query(models.Project).count() > 0:
        db.close()
        return

    project1 = models.Project(
        name="API Integration Platform",
        description="Modernization of partner API integration and onboarding.",
    )
    project2 = models.Project(
        name="Research Insights Dashboard",
        description="Customer-facing dashboard for weekly research insights.",
    )
    db.add_all([project1, project2])
    db.flush()

    m1 = models.Milestone(
        project_id=project1.id,
        title="Complete core API gateway",
        status="In Progress",
        sort_order=1,
    )
    m2 = models.Milestone(
        project_id=project1.id,
        title="Pilot with first partner",
        status="Not Started",
        sort_order=2,
    )
    m3 = models.Milestone(
        project_id=project2.id,
        title="Finalize UX for dashboard",
        status="Complete",
        sort_order=1,
    )
    db.add_all([m1, m2, m3])

    last_week = date.today() - timedelta(days=7)
    u1 = models.WeeklyUpdate(
        project_id=project1.id,
        user_name="Alex",
        week_start=last_week,
        accomplishments="Completed OAuth2 flows and rate limiting.",
        plans_next_week="Start integration with first pilot partner.",
        risks_issues="Dependency on partner sandbox availability.",
    )
    db.add(u1)
    db.flush()

    r1 = models.WeeklyReport(
        project_id=project1.id,
        week_start=last_week,
        draft_text="API Integration Platform progress last week...",
        final_text="Finalized summary for API Integration Platform last week.",
    )
    db.add(r1)

    db.commit()
    db.close()


if __name__ == "__main__":
    seed()

