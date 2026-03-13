from __future__ import annotations

import os
from typing import Optional

from openai import OpenAI

from .models import WeeklyUpdate, WeeklyReport, Milestone, Project


def _build_prompt(
    project: Project,
    milestones: list[Milestone],
    updates: list[WeeklyUpdate],
    last_report: Optional[WeeklyReport],
) -> str:
    milestone_lines = [
        f"- {m.title} (status: {m.status or 'n/a'}){f' — {m.notes}' if m.notes else ''}"
        for m in sorted(milestones, key=lambda m: (m.sort_order or 0, m.id))
    ]
    update_lines = []
    for u in updates:
        update_lines.append(
            f"Update from {u.user_name} for week starting {u.week_start.isoformat()}:"
        )
        if u.accomplishments:
            update_lines.append(f"  Accomplishments: {u.accomplishments}")
        if u.plans_next_week:
            update_lines.append(f"  Plans for next week: {u.plans_next_week}")
        if u.risks_issues:
            update_lines.append(f"  Risks / Issues: {u.risks_issues}")
        if u.notes:
            update_lines.append(f"  Notes: {u.notes}")
        update_lines.append("")

    last_report_text = last_report.final_text or last_report.draft_text if last_report else ""

    prompt = f"""
You are a project status reporting assistant.

Write a concise, customer-friendly weekly status report for the project "{project.name}".

Project description:
{project.description or "N/A"}

Current milestones:
{os.linesep.join(milestone_lines) if milestone_lines else "No milestones recorded."}

This week's updates:
{os.linesep.join(update_lines) if update_lines else "No updates submitted."}

Last week's finalized report (if any):
{last_report_text or "No prior report."}

Structure the report using clear markdown sections:
- Executive Summary
- Project-by-Project Updates (for this one project)
- Risks / Issues (with owners + next steps)
- Plans for Next Week
"""
    return prompt


def generate_weekly_report_text(
    project: Project,
    milestones: list[Milestone],
    updates: list[WeeklyUpdate],
    last_report: Optional[WeeklyReport],
) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    prompt = _build_prompt(project, milestones, updates, last_report)

    if not api_key:
        # Fallback deterministic template if no API key configured.
        return (
            f"# Executive Summary\n\n"
            f"Summary for project **{project.name}** for this week.\n\n"
            f"# Project Updates\n\n"
            f"{os.linesep.join(line for line in prompt.splitlines() if 'This week' in line or 'Accomplishments' in line)}\n\n"
            f"# Risks / Issues\n\n"
            f"(Fill in key risks and owners.)\n\n"
            f"# Plans for Next Week\n\n"
            f"(Summarize upcoming work based on the updates.)\n"
        )

    client = OpenAI(api_key=api_key)
    completion = client.responses.create(
        model=model,
        input=prompt,
    )

    return completion.output[0].content[0].text

