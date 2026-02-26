import React, { useEffect, useState } from 'react';
import { useMasterData } from '@/hooks/useMasterData';
import { getGlobalMasterDataState } from '@shared/state-management/master-data-state';
import { getGlobalEventBus } from '@shared/mfe';
import { RefreshCw, Database, AlertCircle, CheckCircle } from 'lucide-react';

const MasterDataMFE: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedTable, setSelectedTable] = useState<'countries' | 'regions' | 'departments' | 'employees'>('countries');
  const [syncStats, setSyncStats] = useState<{
    memoryCacheSize: number;
    registeredTables: number;
  }>({ memoryCacheSize: 0, registeredTables: 0 });

  const masterDataState = getGlobalMasterDataState();
  const eventBus = getGlobalEventBus();

  // Use the selected table
  const { data: tableData, loading, error, refetch, syncStatus } = useMasterData<any>(selectedTable);

  // Initialize master data on mount
  useEffect(() => {
    const initializeMasterData = async () => {
      try {
        // Register countries table
        await masterDataState.registerTable({
          name: 'countries',
          displayName: 'Countries',
          endpoint: '/api/master/countries',
          keyPath: 'id',
          indexes: [
            { name: 'code', keyPath: 'code', unique: true },
            { name: 'region', keyPath: 'region' },
          ],
          syncInterval: 5 * 60 * 1000, // 5 minutes
        });

        // Register regions table
        await masterDataState.registerTable({
          name: 'regions',
          displayName: 'Regions',
          endpoint: '/api/master/regions',
          keyPath: 'id',
          indexes: [
            { name: 'code', keyPath: 'code', unique: true },
            { name: 'continent', keyPath: 'continent' },
          ],
          syncInterval: 5 * 60 * 1000,
        });

        // Register departments table
        await masterDataState.registerTable({
          name: 'departments',
          displayName: 'Departments',
          endpoint: '/api/master/departments',
          keyPath: 'id',
          indexes: [
            { name: 'code', keyPath: 'code', unique: true },
            { name: 'status', keyPath: 'status' },
          ],
          syncInterval: 5 * 60 * 1000,
        });

        // Register employees table
        await masterDataState.registerTable({
          name: 'employees',
          displayName: 'Employees',
          endpoint: '/api/master/employees',
          keyPath: 'id',
          indexes: [
            { name: 'email', keyPath: 'email', unique: true },
            { name: 'department', keyPath: 'department' },
            { name: 'status', keyPath: 'status' },
          ],
          syncInterval: 5 * 60 * 1000,
        });

        setIsInitialized(true);
        eventBus.emit('mfe:master-data:initialized', {
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to initialize master data:', err);
      }
    };

    initializeMasterData();
  }, [masterDataState, eventBus]);

  // Update sync stats
  useEffect(() => {
    const stats = masterDataState.getCacheStats();
    setSyncStats({
      memoryCacheSize: stats.memoryCacheSize,
      registeredTables: stats.registeredTables,
    });

    const unsubscribe = eventBus.on('state:sync:completed', () => {
      const updatedStats = masterDataState.getCacheStats();
      setSyncStats({
        memoryCacheSize: updatedStats.memoryCacheSize,
        registeredTables: updatedStats.registeredTables,
      });
    });

    return () => unsubscribe.unsubscribe();
  }, [masterDataState, eventBus]);

  const handleRefresh = async () => {
    await refetch();
  };

  const handleManualSync = async () => {
    await masterDataState.syncTable('countries');
  };

  const handleClearCache = async () => {
    await masterDataState.clearAllCaches();
    await refetch();
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Master Data Management</h1>
        <p className="text-indigo-100">
          Centralized state management with IndexedDB caching and background sync
        </p>
      </div>

      {/* Table Selection Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['countries', 'regions', 'departments', 'employees'].map((table) => (
          <button
            key={table}
            onClick={() => setSelectedTable(table as any)}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              selectedTable === table
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {table.charAt(0).toUpperCase() + table.slice(1)}
          </button>
        ))}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-gray-600 text-sm font-medium">Status</div>
          <div className="flex items-center gap-2 mt-2">
            {syncStatus === 'synced' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : syncStatus === 'syncing' ? (
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            ) : syncStatus === 'failed' ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : (
              <Database className="w-5 h-5 text-gray-600" />
            )}
            <span className="font-semibold text-gray-900 capitalize">
              {syncStatus}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-gray-600 text-sm font-medium">Records</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {tableData.length}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-gray-600 text-sm font-medium">Memory Cache</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {syncStats.memoryCacheSize}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-gray-600 text-sm font-medium">Tables</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {syncStats.registeredTables}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-blue-800">Loading master data...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Data Table */}
      {!loading && tableData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {tableData.length > 0 &&
                    Object.keys(tableData[0]).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {tableData.slice(0, 10).map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {Object.values(row).map((value, colIdx) => (
                      <td
                        key={colIdx}
                        className="px-6 py-3 text-sm text-gray-900 max-w-xs truncate"
                      >
                        {typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tableData.length > 10 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
              Showing 10 of {tableData.length} records
            </div>
          )}
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && tableData.length === 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No data available for {selectedTable}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>

        <button
          onClick={handleManualSync}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Database className="w-4 h-4" />
          Manual Sync
        </button>

        <button
          onClick={handleClearCache}
          className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
        >
          <AlertCircle className="w-4 h-4" />
          Clear Cache
        </button>
      </div>

      {/* Features Info */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="font-bold text-indigo-900 mb-3">✨ Features</h3>
        <ul className="space-y-2 text-indigo-800 text-sm">
          <li>✓ Centralized master data caching with IndexedDB</li>
          <li>✓ Automatic version tracking via X-Master-Data-Version header</li>
          <li>✓ Silent background sync without blocking UI</li>
          <li>✓ Memory cache for faster access</li>
          <li>✓ Full cross-browser IndexedDB support</li>
          <li>✓ Event-driven architecture for MFE communication</li>
          <li>✓ Promise-based API for easy integration</li>
          <li>✓ Comprehensive error handling and logging</li>
        </ul>
      </div>
    </div>
  );
};

export default MasterDataMFE;
