import sqlite3
from fastapi import HTTPException
from typing import Optional

DATABASE_URL = './data.db'

def init_db():
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            completed BOOLEAN DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    conn.commit()
    conn.close()

def create_task(user_id: int, title: str) -> int:
    try:
        conn = sqlite3.connect(DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO tasks (user_id, title, completed) VALUES (?, ?, 0)',
            (user_id, title)
        )
        conn.commit()
        task_id = cursor.lastrowid
        conn.close()
        return task_id
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail="Database error occurred while creating a task")

def complete_task(user_id: int, task_id: int):
    try:
        conn = sqlite3.connect(DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute(
            'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
            (task_id, user_id)
        )
        result = cursor.fetchone()
        if result is None:
            raise HTTPException(status_code=404, detail="Task not found")

        cursor.execute(
            'UPDATE tasks SET completed = 1 WHERE id = ?',
            (task_id,)
        )
        conn.commit()
        conn.close()
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail="Database error occurred while completing a task")

def delete_task(user_id: int, task_id: int):
    try:
        conn = sqlite3.connect(DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute(
            'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
            (task_id, user_id)
        )
        result = cursor.fetchone()
        if result is None:
            raise HTTPException(status_code=404, detail="Task not found")

        cursor.execute(
            'DELETE FROM tasks WHERE id = ?',
            (task_id,)
        )
        conn.commit()
        conn.close()
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail="Database error occurred while deleting a task")
