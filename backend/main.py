from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os

from .tasks import init_db, create_task, complete_task, delete_task

app = FastAPI()

origins = os.environ.get("VITE_API_URL", ["*"])  # Allow all origins for local dev

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/")
def read_root():
    return {"status": "ok", "version": "0.1.0"}

@app.post("/tasks")
def api_create_task(user_id: int, title: str):
    try:
        task_id = create_task(user_id, title)
        return {"task_id": task_id}
    except HTTPException as e:
        raise e

@app.put("/tasks/{task_id}/complete")
def api_complete_task(user_id: int, task_id: int):
    try:
        complete_task(user_id, task_id)
        return {"status": "task completed"}
    except HTTPException as e:
        raise e

@app.delete("/tasks/{task_id}")
def api_delete_task(user_id: int, task_id: int):
    try:
        delete_task(user_id, task_id)
        return {"status": "task deleted"}
    except HTTPException as e:
        raise e
