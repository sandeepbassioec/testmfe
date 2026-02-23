import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getGlobalEventBus } from '@shared/mfe';

interface AnalyticsData {
  date: string;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData[]>([
    { date: '1st', pageViews: 2400, bounceRate: 24, avgSessionDuration: 3.2 },
    { date: '2nd', pageViews: 1398, bounceRate: 21, avgSessionDuration: 3.8 },
    { date: '3rd', pageViews: 9800, bounceRate: 29, avgSessionDuration: 4.1 },
    { date: '4th', pageViews: 3908, bounceRate: 20, avgSessionDuration: 2.9 },
    { date: '5th', pageViews: 4800, bounceRate: 22, avgSessionDuration: 3.5 },
    { date: '6th', pageViews: 3800, bounceRate: 25, avgSessionDuration: 3.9 },
  ]);

  const eventBus = getGlobalEventBus();

  useEffect(() => {
    eventBus.emit('mfe:analytics:loaded', {
      timestamp: new Date().toISOString(),
    });
  }, [eventBus]);

  return (
    <div className="w-full space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Analytics & Insights</h1>
        <p className="text-purple-100">Detailed analysis of user behavior and engagement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-gray-600 text-sm font-medium">Total Page Views</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">28,043</div>
          <div className="text-green-600 text-sm mt-2">+5.2% vs last period</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-gray-600 text-sm font-medium">Bounce Rate</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">24.3%</div>
          <div className="text-red-600 text-sm mt-2">-2.1% improvement</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-gray-600 text-sm font-medium">Avg Session Duration</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">3m 45s</div>
          <div className="text-green-600 text-sm mt-2">+12s vs last period</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-gray-600 text-sm font-medium">Conversion Rate</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">3.24%</div>
          <div className="text-green-600 text-sm mt-2">+0.4% increase</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Page Views Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="pageViews"
              fill="#8884d8"
              fillOpacity={0.8}
              stroke="#8884d8"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bounce Rate Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="bounceRate"
                stroke="#ef4444"
                name="Bounce Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top Pages</h3>
          <div className="space-y-3">
            {[
              { page: '/home', views: 8234, conversion: 3.2 },
              { page: '/products', views: 6142, conversion: 4.1 },
              { page: '/pricing', views: 4521, conversion: 2.8 },
              { page: '/about', views: 3156, conversion: 1.9 },
              { page: '/contact', views: 2145, conversion: 5.2 },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              >
                <div>
                  <div className="font-medium text-gray-900">{item.page}</div>
                  <div className="text-sm text-gray-600">{item.views} views</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{item.conversion}%</div>
                  <div className="text-xs text-gray-600">conversion</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Traffic Sources</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { source: 'Direct', percentage: 35, count: 4500 },
            { source: 'Organic', percentage: 40, count: 5200 },
            { source: 'Referral', percentage: 15, count: 2100 },
            { source: 'Social', percentage: 10, count: 1300 },
          ].map(item => (
            <div key={item.source} className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-3">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    strokeDasharray={`${(item.percentage / 100) * 283} 283`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">{item.percentage}%</span>
                </div>
              </div>
              <div className="font-medium text-gray-900">{item.source}</div>
              <div className="text-sm text-gray-600">{item.count} visits</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
