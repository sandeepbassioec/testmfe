/**
 * Master Data State Manager
 * Centralized state management for MFEs with IndexedDB caching
 */

import { getGlobalEventBus } from '@shared/mfe';
import { getGlobalIndexedDBManager } from './indexeddb-manager';
import { getGlobalHttpApi } from '@shared/mfe';
import { AdvancedQuery } from './advanced-query';
import type {
  MasterTableConfig,
  MasterTableData,
  StateChangeEvent,
  CacheOptions,
  VersionMetadata,
  SyncStatus,
} from './types';
import type { AdvancedQueryOptions, QueryResult } from './advanced-query';

class MasterDataStateManager {
  private tables: Map<string, MasterTableConfig> = new Map();
  private memoryCache: Map<string, MasterTableData[]> = new Map();
  private syncStatus: Map<string, SyncStatus> = new Map();
  private eventBus = getGlobalEventBus();
  private idbManager = getGlobalIndexedDBManager();
  private api = getGlobalHttpApi();
  private options: Required<CacheOptions>;
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isSyncing = false;

  constructor(options: CacheOptions = {}) {
    this.options = {
      useIndexedDB: options.useIndexedDB ?? true,
      useMemoryCache: options.useMemoryCache ?? true,
      enableVersionTracking: options.enableVersionTracking ?? true,
      enableBackgroundSync: options.enableBackgroundSync ?? true,
    };

    this._log('Master Data State Manager initialized');
  }

  /**
   * Register a master table
   */
  async registerTable(config: MasterTableConfig): Promise<void> {
    if (this.tables.has(config.name)) {
      throw new Error(`Table ${config.name} already registered`);
    }

    this.tables.set(config.name, config);

    // Create IndexedDB store
    if (this.options.useIndexedDB) {
      try {
        await this.idbManager.initialize();
        await this.idbManager.createTableStore(config);
        this._log(`Table store created: ${config.name}`);
      } catch (error) {
        this._log(`Failed to create table store: ${error}`, 'error');
      }
    }

    // Start background sync if enabled
    if (this.options.enableBackgroundSync) {
      this._startBackgroundSync(config.name);
    }

    this.eventBus.emit('state:table:registered', { tableName: config.name });
  }

  /**
   * Get data from a table
   */
  async getData<T extends MasterTableData>(tableName: string): Promise<T[]> {
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} not registered`);
    }

    // Check memory cache first
    if (this.options.useMemoryCache) {
      const cached = this.memoryCache.get(tableName);
      if (cached) {
        this._log(`Cache hit (memory): ${tableName}`);
        return cached as T[];
      }
    }

    // Check IndexedDB
    if (this.options.useIndexedDB) {
      try {
        const idbData = await this.idbManager.getAll<T>(tableName);
        if (idbData.length > 0) {
          // Update memory cache
          this.memoryCache.set(tableName, idbData);
          this._log(`Cache hit (IndexedDB): ${tableName}`);
          return idbData;
        }
      } catch (error) {
        this._log(`Failed to get from IndexedDB: ${error}`, 'warn');
      }
    }

    // Fetch from server
    return this._fetchFromServer<T>(tableName);
  }

  /**
   * Get data by key
   */
  async getDataByKey<T extends MasterTableData>(
    tableName: string,
    key: string | number
  ): Promise<T | undefined> {
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} not registered`);
    }

    // Try IndexedDB first
    if (this.options.useIndexedDB) {
      try {
        const data = await this.idbManager.getByKey<T>(tableName, key);
        if (data) {
          this._log(`Key lookup: ${tableName}[${key}]`);
          return data;
        }
      } catch (error) {
        this._log(`Failed to get key from IndexedDB: ${error}`, 'warn');
      }
    }

    // Fallback to memory cache
    if (this.options.useMemoryCache) {
      const cached = this.memoryCache.get(tableName);
      if (cached) {
        return (cached.find(item => item[table.keyPath] === key) as T) || undefined;
      }
    }

    return undefined;
  }

  /**
   * Execute advanced query on table data
   */
  async query<T extends MasterTableData>(
    tableName: string,
    options: AdvancedQueryOptions
  ): Promise<QueryResult<T>> {
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} not registered`);
    }

    // Validate query options
    const validation = AdvancedQuery.validate(options);
    if (!validation.valid) {
      throw new Error(`Invalid query: ${validation.errors.join(', ')}`);
    }

    // Get data (from cache or server)
    const data = await this.getData<T>(tableName);

    // Execute query
    const result = AdvancedQuery.execute(data, options);

    // Emit query event
    this.eventBus.emit('state:query:executed', {
      tableName,
      filteredCount: result.filteredCount,
      executionTime: result.executionTime,
    });

    return result;
  }

  /**
   * Fetch data from server
   */
  private async _fetchFromServer<T extends MasterTableData>(
    tableName: string
  ): Promise<T[]> {
    const table = this.tables.get(tableName);
    if (!table) {
      return [];
    }

    try {
      this._log(`Fetching from server: ${tableName}`);

      const response = await this.api.get<T[]>(table.endpoint);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = response.data || [];
      const version = response.headers?.['x-master-data-version'] || '';

      // Save to caches
      await this._saveData(tableName, data, version);

      // Update memory cache
      if (this.options.useMemoryCache) {
        this.memoryCache.set(tableName, data);
      }

      this.eventBus.emit('state:data:fetched', {
        tableName,
        recordCount: data.length,
        version,
      });

      return data;
    } catch (error) {
      this._log(`Failed to fetch from server: ${error}`, 'error');
      this.eventBus.emit('state:fetch:error', {
        tableName,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Save data to caches
   */
  private async _saveData(
    tableName: string,
    data: MasterTableData[],
    version: string
  ): Promise<void> {
    // Save to IndexedDB
    if (this.options.useIndexedDB) {
      try {
        await this.idbManager.save(tableName, data);

        // Update version metadata
        if (this.options.enableVersionTracking) {
          const metadata: VersionMetadata = {
            tableName,
            version,
            timestamp: Date.now(),
            lastSyncTime: Date.now(),
            recordCount: data.length,
            syncStatus: 'synced',
          };
          await this.idbManager.saveVersionMetadata(metadata);
        }

        this._log(`Data saved to IndexedDB: ${tableName}`);
      } catch (error) {
        this._log(`Failed to save to IndexedDB: ${error}`, 'warn');
      }
    }
  }

  /**
   * Start background sync for a table
   */
  private _startBackgroundSync(tableName: string): void {
    const table = this.tables.get(tableName);
    if (!table || !table.syncInterval) {
      return;
    }

    // Clear existing interval if any
    const existingInterval = this.syncIntervals.get(tableName);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Set up background sync
    const interval = setInterval(() => {
      this._syncTableInBackground(tableName);
    }, table.syncInterval);

    this.syncIntervals.set(tableName, interval);
    this._log(`Background sync started for: ${tableName}`);
  }

  /**
   * Sync table in background
   */
  private async _syncTableInBackground(tableName: string): Promise<void> {
    if (this.isSyncing) {
      return; // Prevent concurrent syncs
    }

    this.isSyncing = true;

    try {
      const table = this.tables.get(tableName);
      if (!table) {
        return;
      }

      // Get current version from IndexedDB
      const currentMetadata = await this.idbManager.getVersionMetadata(tableName);

      // Update sync status
      this.syncStatus.set(tableName, {
        tableName,
        status: 'syncing',
        timestamp: Date.now(),
        recordsUpdated: 0,
      });

      // Fetch from server
      const response = await this.api.get<MasterTableData[]>(table.endpoint);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const serverVersion = response.headers?.['x-master-data-version'] || '';
      const serverData = response.data || [];

      // Compare versions
      if (
        currentMetadata &&
        currentMetadata.version === serverVersion
      ) {
        this._log(`No update needed for: ${tableName}`);
        this.syncStatus.set(tableName, {
          tableName,
          status: 'synced',
          timestamp: Date.now(),
          recordsUpdated: 0,
        });
        return;
      }

      // Save updated data
      await this._saveData(tableName, serverData, serverVersion);

      // Notify about sync completion
      this.syncStatus.set(tableName, {
        tableName,
        status: 'synced',
        timestamp: Date.now(),
        recordsUpdated: serverData.length,
      });

      this.eventBus.emit('state:sync:completed', {
        tableName,
        recordCount: serverData.length,
        version: serverVersion,
      });

      this._log(`Background sync completed: ${tableName}`);
    } catch (error) {
      this.syncStatus.set(tableName, {
        tableName,
        status: 'failed',
        timestamp: Date.now(),
        recordsUpdated: 0,
        error: error instanceof Error ? error.message : String(error),
      });

      this._log(`Background sync failed: ${error}`, 'error');
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Manually trigger sync for a table
   */
  async syncTable(tableName: string): Promise<void> {
    await this._syncTableInBackground(tableName);
  }

  /**
   * Sync all tables
   */
  async syncAllTables(): Promise<void> {
    const promises = Array.from(this.tables.keys()).map(tableName =>
      this._syncTableInBackground(tableName)
    );
    await Promise.all(promises);
  }

  /**
   * Get sync status
   */
  getSyncStatus(tableName?: string): SyncStatus | Map<string, SyncStatus> {
    if (tableName) {
      return (
        this.syncStatus.get(tableName) || {
          tableName,
          status: 'pending',
          timestamp: Date.now(),
          recordsUpdated: 0,
        }
      );
    }
    return this.syncStatus;
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear IndexedDB
    if (this.options.useIndexedDB) {
      for (const tableName of this.tables.keys()) {
        try {
          await this.idbManager.deleteTable(tableName);
        } catch (error) {
          this._log(`Failed to clear table: ${error}`, 'warn');
        }
      }
    }

    this.eventBus.emit('state:cache:cleared', {});
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    memoryCacheSize: number;
    registeredTables: number;
    syncStatus: Map<string, SyncStatus>;
  } {
    return {
      memoryCacheSize: this.memoryCache.size,
      registeredTables: this.tables.size,
      syncStatus: this.syncStatus,
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    // Stop all background sync intervals
    this.syncIntervals.forEach(interval => clearInterval(interval));
    this.syncIntervals.clear();

    // Clear memory cache
    this.memoryCache.clear();

    // Close IndexedDB
    this.idbManager.close();

    this._log('Master Data State Manager destroyed');
  }

  /**
   * Internal logging
   */
  private _log(message: string, level: 'log' | 'warn' | 'error' = 'log'): void {
    const prefix = '[Master Data State]';
    console[level](`${prefix} ${message}`);
  }
}

let globalMasterDataState: MasterDataStateManager | null = null;

export const getGlobalMasterDataState = (
  options?: CacheOptions
): MasterDataStateManager => {
  if (!globalMasterDataState) {
    globalMasterDataState = new MasterDataStateManager(options);
  }
  return globalMasterDataState;
};

export { MasterDataStateManager };
