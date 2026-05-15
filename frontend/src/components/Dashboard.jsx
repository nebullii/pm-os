import React from 'react';

const Dashboard = () => {
  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Dashboard</h2>
      <div className="flex justify-between">
        <div className="text-center">
          <span className="text-gray-600">Pending Tasks</span>
          <div className="text-2xl font-semibold">0</div>
        </div>
        <div className="text-center">
          <span className="text-gray-600">Completed Tasks</span>
          <div className="text-2xl font-semibold">0</div>
        </div>
      </div>
    </div>
  )
};

export default Dashboard;
