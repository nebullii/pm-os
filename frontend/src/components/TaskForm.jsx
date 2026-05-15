import React from 'react';

const TaskForm = () => {
  return (
    <div className="p-4 bg-white rounded shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">Add New Task</h2>
      <form className="flex flex-col">
        <input
          type="text"
          placeholder="Task Title"
          className="border p-2 mb-4 rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Add Task
        </button>
      </form>
    </div>
  );
};

export default TaskForm;
