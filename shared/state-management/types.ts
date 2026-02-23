/**
 * State Management Types for Micro Frontend Framework
 */

export interface MasterTableData {
  id: string | number;
  [key: string]: any;
}

export interface MasterTableConfig {
  name: string;
  displayName: string;
  endpoint: string;
  keyPath: string; // Primary key for the table
  indexes?: {
    name: string;
    keyPath: string;
    unique?: boolean;
  }[];
  ttl?: number; // Time to live in milliseconds
  syncInterval?: number; // Background sync interval
}

export interface VersionMetadata {
  tableName: string;
  version: string;
  timestamp: number;
  lastSyncTime: number;
  recordCount: number;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  lastError?: string;
}

export interface SyncStatus {
  tableName: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  timestamp: number;
  recordsUpdated: number;
  error?: string;
}

export interface StateChangeEvent {
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC';
  tableName: string;
  data: any;
  timestamp: number;
  source: string;
}

export interface CacheOptions {
  useIndexedDB?: boolean;
  useMemoryCache?: boolean;
  enableVersionTracking?: boolean;
  enableBackgroundSync?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  version?: string;
  timestamp?: number;
  headers?: Record<string, string>;
}
