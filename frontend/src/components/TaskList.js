import React, { useState, useEffect } from 'react';
import { completeTask, deleteTask } from '../api';

const TaskList = ({ tasks, refreshTasks }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleComplete = async (taskId) => {
    setLoading(true);
    try {
      await completeTask(taskId);
      refreshTasks();
      setError(null);
    } catch (err) {
      setError(err.message || 'Error completing task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    setLoading(true);
    try {
      await deleteTask(taskId);
      refreshTasks();
      setError(null);
    } catch (err) {
      setError(err.message || 'Error deleting task');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Task List</h2>
      {error && <p className="text-red-500">{error}</p>}
      {tasks.length === 0 ? (
        <p>No tasks available</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id} className="flex justify-between items-center mb-2">
              <div>
                <p className="font-semibold">{task.title}</p>
                <p>{task.completed ? 'Completed' : 'Pending'}</p>
              </div>
              {task.completed ? null : (
                <button
                  onClick={() => handleComplete(task.id)}
                  className="bg-green-500 text-white px-2 py-1 mx-1"
                >
                  Complete
                </button>
              )}
              <button
                onClick={() => handleDelete(task.id)}
                className="bg-red-500 text-white px-2 py-1"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskList;
