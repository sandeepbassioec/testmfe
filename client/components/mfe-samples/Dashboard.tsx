import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getGlobalEventBus } from '@shared/mfe';

interface DashboardData {
  month: string;
  users: number;
  revenue: number;
  sessions: number;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData[]>([
    { month: 'Jan', users: 4000, revenue: 2400, sessions: 2210 },
    { month: 'Feb', users: 3000, revenue: 1398, sessions: 2290 },
    { month: 'Mar', users: 2000, revenue: 9800, sessions: 2000 },
    { month: 'Apr', users: 2780, revenue: 3908, sessions: 2108 },
    { month: 'May', users: 1890, revenue: 4800, sessions: 2500 },
    { month: 'Jun', users: 2390, revenue: 3800, sessions: 2500 },
  ]);

  const eventBus = getGlobalEventBus();

  useEffect(() => {
    eventBus.emit('mfe:dashboard:loaded', {
      timestamp: new Date().toISOString(),
    });

    // Simulate data updates
    const interval = setInterval(() => {
      setData(prev =>
        prev.map(item => ({
          ...item,
          users: Math.max(1000, item.users + Math.random() * 500 - 250),
          revenue: Math.max(1000, item.revenue + Math.random() * 500 - 250),
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [eventBus]);

  return (
    <div className="w-full space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-blue-100">Real-time analytics and metrics overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="text-gray-600 text-sm font-medium">Total Users</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">12,543</div>
          <div className="text-green-600 text-sm mt-2">+12% from last month</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="text-gray-600 text-sm font-medium">Revenue</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">$43,892</div>
          <div className="text-green-600 text-sm mt-2">+8% from last month</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="text-gray-600 text-sm font-medium">Active Sessions</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">2,345</div>
          <div className="text-green-600 text-sm mt-2">+15% from last month</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Metrics</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="users" fill="#3b82f6" name="Users" />
            <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
            <Bar dataKey="sessions" fill="#f59e0b" name="Sessions" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top Regions</h3>
          <div className="space-y-3">
            {[
              { name: 'North America', value: 45 },
              { name: 'Europe', value: 30 },
              { name: 'Asia', value: 20 },
              { name: 'Other', value: 5 },
            ].map(region => (
              <div key={region.name} className="flex items-center justify-between">
                <span className="text-gray-700">{region.name}</span>
                <div className="flex items-center gap-2 flex-1 ml-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${region.value}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-600 text-sm w-8 text-right">{region.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { action: 'User signup', time: '2 min ago' },
              { action: 'Payment processed', time: '5 min ago' },
              { action: 'Report generated', time: '12 min ago' },
              { action: 'User login', time: '25 min ago' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-gray-700">{item.action}</span>
                <span className="text-gray-500 text-sm">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
