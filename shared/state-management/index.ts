/**
 * Master Data State Management System
 * Centralized state management with IndexedDB caching and background sync
 */

// Types
export * from './types';
export * from './advanced-query';
export * from './security';

// IndexedDB Manager
export {
  IndexedDBManager,
  getGlobalIndexedDBManager,
} from './indexeddb-manager';

// Master Data State Manager
export {
  MasterDataStateManager,
  getGlobalMasterDataState,
} from './master-data-state';

// Advanced Query
export { AdvancedQuery } from './advanced-query';

// Security
export {
  RateLimiter,
  InputValidator,
  EncryptionUtils,
  SecurityHeaders,
  getGlobalRateLimiter,
} from './security';

/**
 * Initialize State Management System
 */
export async function initializeStateManagement(config?: {
  useIndexedDB?: boolean;
  useMemoryCache?: boolean;
  enableVersionTracking?: boolean;
  enableBackgroundSync?: boolean;
  masterTables?: any[];
}) {
  const { getGlobalMasterDataState } = require('./master-data-state');

  const stateManager = getGlobalMasterDataState(config);

  // Register master tables if provided
  if (config?.masterTables && Array.isArray(config.masterTables)) {
    for (const table of config.masterTables) {
      await stateManager.registerTable(table);
    }
  }

  return stateManager;
}
