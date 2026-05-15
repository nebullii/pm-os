# Build Decisions

## Tech Stack
- **Language**: Python
- **Framework**: FastAPI
- **Database**: sqlite3
- **Frontend**: React + Vite
- **Styling**: Tailwind CSS

## Architecture
FastAPI handles API requests and JWT authentication, React with Vite for the frontend, and SQLite for persistent storage.

## Reasoning
Complexity level 3 due to user accounts and multiple features like task management and dashboard. FastAPI and Python are suitable for handling API and authentication, while React provides a robust frontend framework for a dynamic and interactive UI. SQLite is a great fit for managing user tasks.

## Directory Structure (all agents must follow this)
task-tracker/
  backend/
    app/
      __init__.py
      main.py
      auth.py
      models.py
      services/
        task_service.py
    requirements.txt
  frontend/
    src/
      components/
        Dashboard.jsx
        TaskForm.jsx
      App.jsx
      index.jsx
    public/
      index.html
    tailwind.config.js
    vite.config.js
  .env
  railway.json

