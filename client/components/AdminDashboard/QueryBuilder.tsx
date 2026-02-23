/**
 * Query Builder - Construct and execute advanced queries
 */

import React, { useState } from 'react';
import { Search, Play, RotateCcw, Copy, CheckCircle } from 'lucide-react';
import type { AdvancedQueryOptions, FilterOperator, SortDirection } from '@shared/state-management';

interface QueryBuilderProps {
  stateManager: any;
}

const FILTER_OPERATORS: FilterOperator[] = [
  'eq',
  'ne',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'nin',
  'contains',
  'startsWith',
  'endsWith',
  'regex',
  'between',
];

export default function QueryBuilder({ stateManager }: QueryBuilderProps) {
  const [tableName, setTableName] = useState('countries');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterField, setFilterField] = useState('');
  const [filterOperator, setFilterOperator] = useState<FilterOperator>('eq');
  const [filterValue, setFilterValue] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExecuteQuery = async () => {
    setIsLoading(true);
    try {
      const options: AdvancedQueryOptions = {
        search: searchQuery ? { query: searchQuery, caseSensitive: false } : undefined,
        filters: filterField ? [{
          field: filterField,
          operator: filterOperator,
          value: filterValue,
        }] : undefined,
        sort: sortField ? [{ field: sortField, direction: sortDir }] : undefined,
        pagination: {
          page,
          pageSize: parseInt(String(pageSize)),
        },
        includeStats: true,
      };

      const queryResult = await stateManager.query(tableName, options);
      setResult(queryResult);
    } catch (error) {
      alert(`Query failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setFilterField('');
    setFilterValue('');
    setSortField('');
    setPageSize(10);
    setPage(1);
    setResult(null);
  };

  const handleCopyJSON = () => {
    const json = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold mb-6">Advanced Query Builder</h2>

        {/* Query Configuration */}
        <div className="space-y-4 mb-6">
          {/* Table Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Select Table</label>
            <select
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="countries">Countries</option>
              <option value="regions">Regions</option>
              <option value="categories">Categories</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Search (across all fields)</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter search term..."
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter Section */}
          <div className="border-t border-slate-700 pt-4">
            <h3 className="font-semibold mb-3">Add Filter</h3>
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                value={filterField}
                onChange={(e) => setFilterField(e.target.value)}
                placeholder="Field name"
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <select
                value={filterOperator}
                onChange={(e) => setFilterOperator(e.target.value as FilterOperator)}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                {FILTER_OPERATORS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="Value"
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Sort Section */}
          <div className="border-t border-slate-700 pt-4">
            <h3 className="font-semibold mb-3">Sort</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                placeholder="Field name"
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as SortDirection)}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          {/* Pagination */}
          <div className="border-t border-slate-700 pt-4">
            <h3 className="font-semibold mb-3">Pagination</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Page</label>
                <input
                  type="number"
                  value={page}
                  onChange={(e) => setPage(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Page Size</label>
                <input
                  type="number"
                  value={pageSize}
                  onChange={(e) => setPageSize(Math.max(1, parseInt(e.target.value) || 10))}
                  min="1"
                  max="100"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleExecuteQuery}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 rounded-lg transition-colors font-medium"
          >
            <Play className="w-4 h-4" />
            Execute Query
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Query Results</h3>
            <button
              onClick={handleCopyJSON}
              className="flex items-center gap-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy JSON
                </>
              )}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-900 rounded p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Total Records</p>
              <p className="text-xl font-bold text-blue-400">{result.totalCount}</p>
            </div>
            <div className="bg-slate-900 rounded p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Filtered Records</p>
              <p className="text-xl font-bold text-green-400">{result.filteredCount}</p>
            </div>
            <div className="bg-slate-900 rounded p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Returned</p>
              <p className="text-xl font-bold text-cyan-400">{result.data.length}</p>
            </div>
            <div className="bg-slate-900 rounded p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Exec Time</p>
              <p className="text-xl font-bold text-yellow-400">{(result.executionTime || 0).toFixed(2)}ms</p>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto border border-slate-700 rounded">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  {result.data.length > 0 &&
                    Object.keys(result.data[0]).map((key) => (
                      <th key={key} className="px-4 py-2 text-left text-slate-300 font-semibold">
                        {key}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {result.data.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-4 text-center text-slate-400">
                      No data found
                    </td>
                  </tr>
                ) : (
                  result.data.map((row: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700 transition-colors">
                      {Object.values(row).map((val: any, i: number) => (
                        <td key={i} className="px-4 py-2 text-slate-300">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Info */}
          {result.page && (
            <div className="mt-4 text-center text-sm text-slate-400">
              Page {result.page} ({result.data.length} records)
              {result.hasNextPage && ' • More results available'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
