/**
 * IndexedDB Manager
 * Handles all IndexedDB operations for master data caching
 */

import type { MasterTableConfig, MasterTableData, VersionMetadata } from './types';

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private dbName = 'MFE_MasterData';
  private dbVersion = 1;
  private initialized = false;
  private isSupported = typeof indexedDB !== 'undefined';

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('[IndexedDB] IndexedDB not supported in this browser');
      return false;
    }

    if (this.initialized && this.db) {
      return true;
    }

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = () => {
          console.error('[IndexedDB] Failed to open database');
          resolve(false);
        };

        request.onsuccess = () => {
          this.db = request.result;
          this.initialized = true;
          console.log('[IndexedDB] Database initialized successfully');
          resolve(true);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Create object store for version metadata
          if (!db.objectStoreNames.contains('VersionMetadata')) {
            db.createObjectStore('VersionMetadata', { keyPath: 'tableName' });
          }

          console.log('[IndexedDB] Database upgraded');
        };
      } catch (error) {
        console.error('[IndexedDB] Initialization error:', error);
        resolve(false);
      }
    });
  }

  /**
   * Create object store for a master table
   */
  async createTableStore(config: MasterTableConfig): Promise<void> {
    if (!this.isSupported) return;

    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // If store already exists, update indexes if needed
    if (this.db.objectStoreNames.contains(config.name)) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.dbVersion + 1);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains(config.name)) {
            const store = db.createObjectStore(config.name, {
              keyPath: config.keyPath,
            });

            // Create indexes
            if (config.indexes) {
              config.indexes.forEach((index) => {
                store.createIndex(
                  index.name,
                  index.keyPath,
                  { unique: index.unique || false }
                );
              });
            }
          }
        };

        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };

        request.onerror = () => {
          reject(new Error('Failed to create table store'));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Save data to IndexedDB
   */
  async save(
    tableName: string,
    data: MasterTableData | MasterTableData[]
  ): Promise<void> {
    if (!this.isSupported) return;

    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);

        // Clear existing data
        const clearRequest = store.clear();

        clearRequest.onsuccess = () => {
          // Add new data
          const dataArray = Array.isArray(data) ? data : [data];

          dataArray.forEach((item) => {
            store.add(item);
          });
        };

        transaction.oncomplete = () => {
          resolve();
        };

        transaction.onerror = () => {
          reject(new Error(`Failed to save to ${tableName}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get all data from a table
   */
  async getAll<T extends MasterTableData>(tableName: string): Promise<T[]> {
    if (!this.isSupported) return [];

    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([tableName], 'readonly');
        const store = transaction.objectStore(tableName);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result as T[]);
        };

        request.onerror = () => {
          reject(new Error(`Failed to read from ${tableName}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get data by key
   */
  async getByKey<T extends MasterTableData>(
    tableName: string,
    key: string | number
  ): Promise<T | undefined> {
    if (!this.isSupported) return undefined;

    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([tableName], 'readonly');
        const store = transaction.objectStore(tableName);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result as T | undefined);
        };

        request.onerror = () => {
          reject(new Error(`Failed to get key from ${tableName}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Query by index
   */
  async queryByIndex<T extends MasterTableData>(
    tableName: string,
    indexName: string,
    value: any
  ): Promise<T[]> {
    if (!this.isSupported) return [];

    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([tableName], 'readonly');
        const store = transaction.objectStore(tableName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => {
          resolve(request.result as T[]);
        };

        request.onerror = () => {
          reject(new Error(`Failed to query index ${indexName}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Save version metadata
   */
  async saveVersionMetadata(metadata: VersionMetadata): Promise<void> {
    if (!this.isSupported) return;

    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(['VersionMetadata'], 'readwrite');
        const store = transaction.objectStore('VersionMetadata');
        const request = store.put(metadata);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new Error('Failed to save version metadata'));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get version metadata
   */
  async getVersionMetadata(tableName: string): Promise<VersionMetadata | undefined> {
    if (!this.isSupported) return undefined;

    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(['VersionMetadata'], 'readonly');
        const store = transaction.objectStore('VersionMetadata');
        const request = store.get(tableName);

        request.onsuccess = () => {
          resolve(request.result as VersionMetadata | undefined);
        };

        request.onerror = () => {
          reject(new Error('Failed to get version metadata'));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Delete table data
   */
  async deleteTable(tableName: string): Promise<void> {
    if (!this.isSupported) return;

    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new Error(`Failed to delete ${tableName}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Check if IndexedDB is supported
   */
  isIndexedDBSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

let globalIndexedDBManager: IndexedDBManager | null = null;

export const getGlobalIndexedDBManager = (): IndexedDBManager => {
  if (!globalIndexedDBManager) {
    globalIndexedDBManager = new IndexedDBManager();
  }
  return globalIndexedDBManager;
};

export { IndexedDBManager };
