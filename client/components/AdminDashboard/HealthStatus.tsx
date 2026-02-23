/**
 * Health Status - System health indicator
 */

import React from 'react';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';

interface HealthStatusProps {
  stats: any;
}

export default function HealthStatus({ stats }: HealthStatusProps) {
  if (!stats) {
    return (
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-700">
        <p className="text-slate-400">Loading health status...</p>
      </div>
    );
  }

  const idbStatus = 'operational';
  const syncStatus =
    stats.syncStatus && Object.values(stats.syncStatus).every((s: any) => s.status !== 'failed')
      ? 'operational'
      : 'warning';
  const cacheStatus = stats.memoryCacheSize > 0 ? 'operational' : 'warning';

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'from-green-900 to-green-800';
      case 'warning':
        return 'from-yellow-900 to-yellow-800';
      case 'error':
        return 'from-red-900 to-red-800';
      default:
        return 'from-slate-800 to-slate-900';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* IndexedDB Status */}
      <div className={`bg-gradient-to-br ${getHealthColor(idbStatus)} rounded-lg p-4 border border-green-700`}>
        <div className="flex items-center gap-3 mb-2">
          {getHealthIcon(idbStatus)}
          <span className="font-semibold">IndexedDB</span>
        </div>
        <p className="text-sm text-green-200">Connected • {stats.registeredTables || 0} tables stored</p>
      </div>

      {/* Cache Status */}
      <div className={`bg-gradient-to-br ${getHealthColor(cacheStatus)} rounded-lg p-4 border border-green-700`}>
        <div className="flex items-center gap-3 mb-2">
          {getHealthIcon(cacheStatus)}
          <span className="font-semibold">Memory Cache</span>
        </div>
        <p className="text-sm text-green-200">{stats.memoryCacheSize || 0} items cached</p>
      </div>

      {/* Sync Status */}
      <div className={`bg-gradient-to-br ${getHealthColor(syncStatus)} rounded-lg p-4 border border-green-700`}>
        <div className="flex items-center gap-3 mb-2">
          {getHealthIcon(syncStatus)}
          <span className="font-semibold">Sync Service</span>
        </div>
        <p className="text-sm text-green-200">
          {syncStatus === 'operational' ? 'All syncs healthy' : 'Check sync status'}
        </p>
      </div>
    </div>
  );
}
