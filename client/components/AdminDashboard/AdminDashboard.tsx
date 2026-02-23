/**
 * Admin Dashboard for Master Data Management
 * Monitor and manage caches, sync status, and execute queries
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Database, Activity, Search, Settings } from 'lucide-react';
import { getGlobalMasterDataState } from '@shared/state-management';
import CacheMonitor from './CacheMonitor';
import SyncStatusPanel from './SyncStatusPanel';
import QueryBuilder from './QueryBuilder';
import TableBrowser from './TableBrowser';
import HealthStatus from './HealthStatus';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tables' | 'queries' | 'settings'>(
    'overview'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [stateManager] = useState(() => getGlobalMasterDataState());
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const updateStats = () => {
    const stats = stateManager.getCacheStats();
    setStats(stats);
  };

  const handleClearCache = async () => {
    if (!window.confirm('Are you sure you want to clear all caches? This cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      await stateManager.clearAllCaches();
      updateStats();
      alert('Caches cleared successfully');
    } catch (error) {
      alert(`Error clearing caches: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setIsLoading(true);
    try {
      await stateManager.syncAllTables();
      updateStats();
      alert('Sync completed');
    } catch (error) {
      alert(`Error syncing: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Master Data Admin Dashboard
              </h1>
            </div>
            <div className="text-sm text-slate-400">
              v1.0 • Real-time monitoring
            </div>
          </div>
          <p className="text-slate-400">Manage caches, monitor sync operations, and execute advanced queries</p>
        </div>

        {/* Action Bar */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={handleSyncAll}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 rounded-lg transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Sync All Tables
          </button>
          <button
            onClick={handleClearCache}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 rounded-lg transition-colors font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Caches
          </button>
          <button
            onClick={updateStats}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 rounded-lg transition-colors font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Stats
          </button>
        </div>

        {/* Health Status */}
        <div className="mb-6">
          <HealthStatus stats={stats} />
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-slate-700">
          {['overview', 'tables', 'queries', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab === 'overview' && <Activity className="inline mr-2 w-4 h-4" />}
              {tab === 'tables' && <Database className="inline mr-2 w-4 h-4" />}
              {tab === 'queries' && <Search className="inline mr-2 w-4 h-4" />}
              {tab === 'settings' && <Settings className="inline mr-2 w-4 h-4" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <CacheMonitor stats={stats} onUpdate={updateStats} />
              <SyncStatusPanel stats={stats} />
            </div>
          )}

          {activeTab === 'tables' && <TableBrowser stateManager={stateManager} onUpdate={updateStats} />}

          {activeTab === 'queries' && <QueryBuilder stateManager={stateManager} />}

          {activeTab === 'settings' && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4">System Settings</h2>
              <div className="space-y-4">
                <div className="p-4 bg-slate-900 rounded border border-slate-700">
                  <p className="font-medium mb-2">Configuration</p>
                  <pre className="text-sm text-slate-300 overflow-auto bg-black p-3 rounded">
                    {JSON.stringify(
                      {
                        useIndexedDB: true,
                        useMemoryCache: true,
                        enableVersionTracking: true,
                        enableBackgroundSync: true,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
                <div className="p-4 bg-slate-900 rounded border border-slate-700">
                  <p className="font-medium mb-2">Registered Tables</p>
                  <p className="text-slate-300">{stats?.registeredTables || 0} tables</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
