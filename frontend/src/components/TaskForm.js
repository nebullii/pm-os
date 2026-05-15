import React, { useState } from 'react';
import { createTask } from '../api';

const TaskForm = () => {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Assuming userId comes from some authenticated context or state
      const userId = 1;
      await createTask({ userId, title });
      setTitle('');
      setError(null);
    } catch (err) {
      setError(err.message || 'Error creating task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="p-4" onSubmit={handleSubmit}>
      <h2 className="text-lg font-bold mb-2">Create New Task</h2>
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className="border p-2 mb-2 w-full"
        required
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2" disabled={loading}>
        {loading ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  );
};

export default TaskForm;
