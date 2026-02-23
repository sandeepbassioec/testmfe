/**
 * Table Browser - Browse and manage individual tables
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, Trash2 } from 'lucide-react';

interface TableBrowserProps {
  stateManager: any;
  onUpdate: () => void;
}

export default function TableBrowser({ stateManager, onUpdate }: TableBrowserProps) {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState('countries');
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      // Get registered tables from state manager
      const stats = stateManager.getCacheStats();
      const tableList = Array.from(
        stateManager.tables ? stateManager.tables.entries() : []
      ).map(([name, config]: any) => ({
        name,
        ...config,
      }));
      setTables(tableList);
    } catch (error) {
      console.error('Failed to load tables:', error);
    }
  };

  const loadTableData = async (tableName: string) => {
    setIsLoading(true);
    try {
      const data = await stateManager.getData(tableName);
      setTableData(data);
    } catch (error) {
      alert(`Failed to load table data: ${error}`);
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    loadTableData(tableName);
  };

  const handleSyncTable = async () => {
    setIsLoading(true);
    try {
      await stateManager.syncTable(selectedTable);
      await loadTableData(selectedTable);
      onUpdate();
      alert('Sync completed successfully');
    } catch (error) {
      alert(`Sync failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const json = JSON.stringify(tableData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearTable = async () => {
    if (!window.confirm(`Clear all data from ${selectedTable}? This cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      // Get IndexedDB manager and delete the table
      const idbManager = stateManager.idbManager;
      if (idbManager) {
        await idbManager.deleteTable(selectedTable);
        setTableData([]);
        onUpdate();
        alert('Table cleared successfully');
      }
    } catch (error) {
      alert(`Failed to clear table: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table List */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="font-bold mb-3">Registered Tables</h3>
            <div className="space-y-2">
              {tables.length === 0 ? (
                <p className="text-slate-400 text-sm">No tables registered</p>
              ) : (
                tables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => handleTableSelect(table.name)}
                    className={`w-full text-left px-3 py-2 rounded transition-colors text-sm font-medium ${
                      selectedTable === table.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {table.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Table Details and Data */}
        <div className="lg:col-span-3 space-y-4">
          {/* Table Actions */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={() => loadTableData(selectedTable)}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 rounded text-sm font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Reload
              </button>
              <button
                onClick={handleSyncTable}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 rounded text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Sync
              </button>
              <button
                onClick={handleDownload}
                disabled={tableData.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 rounded text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={handleClearTable}
                disabled={isLoading || tableData.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 rounded text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>

            {/* Table Info */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900 rounded p-3 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Records</p>
                <p className="text-xl font-bold text-blue-400">{tableData.length}</p>
              </div>
              <div className="bg-slate-900 rounded p-3 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Storage Size</p>
                <p className="text-xl font-bold text-green-400">
                  {(JSON.stringify(tableData).length / 1024).toFixed(2)} KB
                </p>
              </div>
              <div className="bg-slate-900 rounded p-3 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Status</p>
                <p className="text-xl font-bold text-cyan-400">Cached</p>
              </div>
            </div>
          </div>

          {/* Data Table */}
          {tableData.length > 0 && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900 border-b border-slate-700">
                    <tr>
                      {Object.keys(tableData[0]).map((key) => (
                        <th key={key} className="px-4 py-3 text-left text-slate-300 font-semibold">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700 transition-colors">
                        {Object.values(row).map((val: any, i: number) => (
                          <td key={i} className="px-4 py-3 text-slate-300">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {tableData.length > 50 && (
                <div className="px-4 py-3 bg-slate-900 text-sm text-slate-400 border-t border-slate-700">
                  Showing 50 of {tableData.length} records
                </div>
              )}
            </div>
          )}

          {tableData.length === 0 && (
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
              <p className="text-slate-400">No data loaded</p>
              <button
                onClick={() => loadTableData(selectedTable)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
              >
                Load Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
