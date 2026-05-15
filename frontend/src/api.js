export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const response = await fetch(`/api${url}`, { ...options, headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Unknown error');
    }
    return response.json();
  } catch (error) {
    throw error;
  }
};

// Fetch counts of pending and completed tasks
export const getTaskCounts = async () => {
  return apiFetch('/tasks/counts');
};

// Create a new task
export const createTask = async ({ userId, title }) => {
  return apiFetch('/tasks', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, title }),
  });
};

// Complete a task
export const completeTask = async (taskId) => {
  return apiFetch(`/tasks/${taskId}/complete`, { method: 'PUT' });
};

// Delete a task
export const deleteTask = async (taskId) => {
  return apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
};
