
#Problem Statement:

In many teams, project updates are collected manually through emails or messages, making it difficult to consolidate and produce a clear weekly status report.

This application solves that problem by:
    >Providing a chat-style interface for submitting updates
    >Persisting project milestones and historical reports
    >Using an LLM to generate a structured weekly report
    >Allowing users to edit and finalize the generated report


#Solution Overview:

The application follows a chat-driven workflow:

1. User enters their name.
2. User selects a project to update.
3. The system shows existing project milestones (memory recap).
4. User submits:
     Accomplishments
     Plans for next week
     Risks / blockers

5. Updates are stored in the database.
6. User clicks Generate Weekly Report.
7. Backend gathers:
     This week’s updates
     Project milestones
     Last week's finalized report

8. This context is sent to an LLM to generate a draft report.
9. User reviews and edits the report.
10. The final report is saved and used as context for next week.

#Tech Stack:
 Frontend
   React
   TypeScript
   Axios
   Chat-style UI components
   Material-UI

  Backend
   Python
   FastAPI
   SQLAlchemy

  Database
   Sqlite
   AI Integration

OpenAI API for report generation


#System Architecture:

React Frontend (Chat UI)
        |
        v
FastAPI Backend
        |
        v
Sqlite Database
        |
        v
OpenAI API (LLM)

#Running the Project:

>>Backend setup (FastAPI + SQLite):
  python3 -m venv venv
  source venv/bin/activate      # every time you work on backend
  pip install fastapi "uvicorn[standard]" sqlalchemy aiosqlite pydantic-settings python-multipart openai
  pip freeze > requirements.txt

  Run seed + dev server (from project root, venv active):

  python -m app.seed
  uvicorn app.main:app --reload --port 8000
    Optional (for real LLM):
      export OPENAI_API_KEY=sk-...
      export OPENAI_MODEL=gpt-4.1-mini

>>Frontend setup (React + Vite + TS):

    npm create vite@latest frontend -- --template react-ts
    cd frontend
    npm install axios
    and install material-ui

    cd frontend
    npm run dev

    ---------------------------------------------
