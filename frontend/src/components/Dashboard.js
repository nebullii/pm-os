import React, { useEffect, useState } from 'react';
import { getTaskCounts } from '../api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [counts, setCounts] = useState({ pending: 0, completed: 0 });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getTaskCounts();
        setCounts(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Task Dashboard</h1>
      <p>Pending Tasks: {counts.pending}</p>
      <p>Completed Tasks: {counts.completed}</p>
    </div>
  );
};

export default Dashboard;
