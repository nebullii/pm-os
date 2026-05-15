import React from 'react';

const TaskList = () => {
  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Task List</h2>
      <ul className="list-none space-y-4">
        <li className="flex justify-between items-center border-b pb-2">
          <span>Sample Task</span>
          <div className="space-x-2">
            <button className="text-green-500 hover:text-green-600">Complete</button>
            <button className="text-red-500 hover:text-red-600">Delete</button>
          </div>
        </li>
        {/* More tasks can be dynamically added here */}
      </ul>
    </div>
  );
};

export default TaskList;
