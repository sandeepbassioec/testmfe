/**
 * Sync Status Panel - Show status of all table syncs
 */

import React from 'react';
import { CheckCircle, AlertCircle, Loader, Clock } from 'lucide-react';

interface SyncStatusPanelProps {
  stats: any;
}

export default function SyncStatusPanel({ stats }: SyncStatusPanelProps) {
  if (!stats?.syncStatus) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <p className="text-slate-400">No sync data available</p>
      </div>
    );
  }

  const syncEntries = Object.entries(stats.syncStatus).map(([_, value]: [string, any]) => value);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'syncing':
        return <Loader className="w-5 h-5 text-yellow-400 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced':
        return 'bg-green-900 text-green-300';
      case 'syncing':
        return 'bg-yellow-900 text-yellow-300';
      case 'failed':
        return 'bg-red-900 text-red-300';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Sync Status Monitor</h2>
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Table Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Records Updated</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {syncEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-slate-400">
                    No sync data available
                  </td>
                </tr>
              ) : (
                syncEntries.map((sync: any) => (
                  <tr key={sync.tableName} className="border-b border-slate-700 hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-slate-300">{sync.tableName}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(sync.status)}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(sync.status)}`}>
                          {sync.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">{sync.recordsUpdated || 0}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(sync.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync Summary */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-2">Successful Syncs</p>
          <p className="text-2xl font-bold text-green-400">
            {syncEntries.filter((s: any) => s.status === 'synced').length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-2">In Progress</p>
          <p className="text-2xl font-bold text-yellow-400">
            {syncEntries.filter((s: any) => s.status === 'syncing').length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-2">Failed Syncs</p>
          <p className="text-2xl font-bold text-red-400">
            {syncEntries.filter((s: any) => s.status === 'failed').length}
          </p>
        </div>
      </div>
    </div>
  );
}
