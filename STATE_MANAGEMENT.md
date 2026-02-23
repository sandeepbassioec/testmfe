# Master Data State Management System

## Overview

A comprehensive, production-ready state management system for MFE applications with:

- **Centralized State Management**: Cross-MFE communication without direct dependencies
- **IndexedDB Caching**: Persistent client-side caching of master/reference data
- **Version Tracking**: Server-driven updates via `X-Master-Data-Version` headers
- **Background Sync**: Silent asynchronous updates without blocking UI
- **Cross-Browser Support**: Full compatibility with Chrome, Firefox, Safari, Edge
- **Promise-Based API**: Easy integration with React and other frameworks
- **Event-Driven Architecture**: Built on proven Event Bus pattern

---

## Architecture

```
┌─────────────────────────────────────┐
│     React MFE Components            │
│  (Dashboard, Analytics, Settings)   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   useMasterData Hook                │
│   (React Integration Layer)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Master Data State Manager          │
│  - Data fetching                    │
│  - Cache management                 │
│  - Background sync                  │
│  - Event emission                   │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌──────────────┐  ┌──────────────┐
│   Memory     │  │  IndexedDB   │
│   Cache      │  │  Storage     │
└──────────────┘  └──────────────┘
       │                │
       └───────┬────────┘
               │
               ▼
    ┌──────────────────────┐
    │   HTTP API Client    │
    │  (with retries)      │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Backend API         │
    │  /api/master/*       │
    │  (X-Master-Data-...) │
    └──────────────────────┘
```

---

## Core Components

### 1. IndexedDB Manager
**File**: `shared/state-management/indexeddb-manager.ts`

Handles all IndexedDB operations:

```typescript
const idbManager = getGlobalIndexedDBManager();

// Initialize
await idbManager.initialize();

// Create object store
await idbManager.createTableStore({
  name: 'countries',
  keyPath: 'id',
  indexes: [{ name: 'code', keyPath: 'code', unique: true }],
});

// Save data
await idbManager.save('countries', countriesData);

// Retrieve data
const allCountries = await idbManager.getAll('countries');
const byId = await idbManager.getByKey('countries', 1);
const byIndex = await idbManager.queryByIndex('countries', 'code', 'US');

// Version metadata
await idbManager.saveVersionMetadata({
  tableName: 'countries',
  version: 'v1.0.0',
  timestamp: Date.now(),
  lastSyncTime: Date.now(),
  recordCount: 10,
  syncStatus: 'synced',
});
```

### 2. Master Data State Manager
**File**: `shared/state-management/master-data-state.ts`

Orchestrates state management:

```typescript
const stateManager = getGlobalMasterDataState({
  useIndexedDB: true,
  useMemoryCache: true,
  enableVersionTracking: true,
  enableBackgroundSync: true,
});

// Register table
await stateManager.registerTable({
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

// Get data (checks cache first, then fetches)
const countries = await stateManager.getData('countries');

// Get by key
const usa = await stateManager.getDataByKey('countries', 1);

// Manual sync
await stateManager.syncTable('countries');
await stateManager.syncAllTables();

// Sync status
const stats = stateManager.getSyncStatus('countries');
const allStats = stateManager.getCacheStats();

// Clear caches
await stateManager.clearAllCaches();
```

### 3. React Hook
**File**: `client/hooks/useMasterData.ts`

Simple hook for React components:

```typescript
const { data, loading, error, refetch, syncStatus } = useMasterData('countries');

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;

return (
  <div>
    <button onClick={() => refetch()}>Refresh</button>
    {data.map(country => (
      <div key={country.id}>{country.name}</div>
    ))}
  </div>
);
```

---

## Data Flow

### Initial Load

```
1. Component renders
   ↓
2. useMasterData hook called
   ↓
3. stateManager.getData('countries')
   ↓
4. Check memory cache → Found? Return
   ↓ Not found
5. Check IndexedDB → Found? Return & cache memory
   ↓ Not found
6. Fetch from /api/master/countries
   ↓
7. Server responds with:
   - Data
   - X-Master-Data-Version header
   ↓
8. Save to IndexedDB + memory cache
   ↓
9. Emit 'state:data:fetched' event
   ↓
10. Component updates with data
```

### Background Sync

```
Every 5 minutes (configurable):
   ↓
1. Set syncStatus to 'syncing'
   ↓
2. Fetch from /api/master/countries
   ↓
3. Get X-Master-Data-Version header
   ↓
4. Compare with stored version
   ↓
5. If versions match: No update needed
   ↓ If versions differ: Update IndexedDB
   ↓
6. Emit 'state:sync:completed' event
   ↓
7. Components listening to event update automatically
   ↓
8. Set syncStatus to 'synced'
```

---

## Server API

### Endpoints

**GET /api/master/countries**
```typescript
Response:
{
  "data": [
    { "id": 1, "code": "US", "name": "United States", "region": "North America" },
    ...
  ],
  "version": "v1.0.0.20240115",
  "timestamp": "2024-01-15T10:30:00Z"
}

Headers:
- X-Master-Data-Version: v1.0.0.20240115
- Cache-Control: max-age=3600
```

**GET /api/master/countries/:id**
```typescript
Response:
{ "id": 1, "code": "US", "name": "United States", "region": "North America" }
```

**GET /api/master/countries/search?region=Europe**
```typescript
Response:
{
  "data": [ /* countries in Europe */ ],
  "count": 4,
  "version": "v1.0.0.20240115"
}
```

**GET /api/master/health**
```typescript
Response:
{
  "status": "healthy",
  "tables": {
    "countries": {
      "recordCount": 12,
      "version": "v1.0.0.20240115",
      "lastUpdated": "2024-01-15T10:30:00Z",
      "status": "synced"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**POST /api/master/sync**
```typescript
Request: { "tables": ["countries"] }
Response:
{
  "message": "Sync triggered successfully",
  "syncedTables": ["countries"],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Complete Example

### Setup

```typescript
// app.ts or main initialization file
import { initializeStateManagement } from '@shared/state-management';

await initializeStateManagement({
  useIndexedDB: true,
  useMemoryCache: true,
  enableVersionTracking: true,
  enableBackgroundSync: true,
  masterTables: [
    {
      name: 'countries',
      displayName: 'Countries',
      endpoint: '/api/master/countries',
      keyPath: 'id',
      indexes: [
        { name: 'code', keyPath: 'code', unique: true },
        { name: 'region', keyPath: 'region' },
      ],
      syncInterval: 5 * 60 * 1000,
    },
  ],
});
```

### Usage in MFE

```typescript
import React from 'react';
import { useMasterData } from '@/hooks/useMasterData';

interface Country {
  id: number;
  code: string;
  name: string;
  region: string;
}

export const CountrySelector = () => {
  const { data: countries, loading, error, syncStatus } = useMasterData<Country>('countries');

  if (loading) return <div>Loading countries...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Countries ({countries.length})</h2>
      <p>Sync Status: {syncStatus}</p>

      <select>
        <option>Select a country</option>
        {countries.map(country => (
          <option key={country.id} value={country.code}>
            {country.name} ({country.region})
          </option>
        ))}
      </select>
    </div>
  );
};
```

---

## Event System

The state management system emits events via the global Event Bus:

```typescript
import { getGlobalEventBus } from '@shared/mfe';

const eventBus = getGlobalEventBus();

// Listen for data fetches
eventBus.on('state:data:fetched', (payload) => {
  console.log(`Fetched ${payload.data.recordCount} records from ${payload.data.tableName}`);
  console.log(`Version: ${payload.data.version}`);
});

// Listen for sync completions
eventBus.on('state:sync:completed', (payload) => {
  console.log(`Sync completed for ${payload.data.tableName}`);
});

// Listen for errors
eventBus.on('state:fetch:error', (payload) => {
  console.error(`Failed to fetch ${payload.data.tableName}: ${payload.data.error}`);
});

// Listen for table registration
eventBus.on('state:table:registered', (payload) => {
  console.log(`Table registered: ${payload.data.tableName}`);
});

// Listen for cache clearing
eventBus.on('state:cache:cleared', () => {
  console.log('All caches cleared');
});
```

---

## Version Management

The system uses `X-Master-Data-Version` headers from the server:

```typescript
// Server sends version in every response
Response Headers:
X-Master-Data-Version: v1.0.0.20240115

// Client stores in IndexedDB VersionMetadata:
{
  tableName: 'countries',
  version: 'v1.0.0.20240115',
  timestamp: 1705315800000,
  lastSyncTime: 1705315800000,
  recordCount: 12,
  syncStatus: 'synced'
}

// On next sync:
- Fetch new data
- Compare X-Master-Data-Version
- If different: Update IndexedDB
- If same: Skip update
```

---

## Browser Compatibility

Fully supported in:
- ✅ Chrome 24+
- ✅ Firefox 16+
- ✅ Safari 10+
- ✅ Edge 15+
- ✅ Opera 15+

Falls back gracefully in browsers without IndexedDB support (uses memory cache only).

---

## Performance Tips

### 1. Set Appropriate Sync Intervals
```typescript
// Not too frequent (saves bandwidth)
// Not too infrequent (stale data)
syncInterval: 5 * 60 * 1000 // 5 minutes is good
```

### 2. Use Proper Indexes
```typescript
indexes: [
  { name: 'code', keyPath: 'code', unique: true },
  { name: 'region', keyPath: 'region', unique: false },
]
```

### 3. Monitor Cache Stats
```typescript
const stats = stateManager.getCacheStats();
console.log('Memory cache size:', stats.memoryCacheSize);
```

### 4. Clean Up When Done
```typescript
// On app unmount
stateManager.destroy();
idbManager.close();
```

---

## Troubleshooting

### Issue: IndexedDB Not Initializing

```typescript
const idbManager = getGlobalIndexedDBManager();
const isSupported = idbManager.isIndexedDBSupported();

if (!isSupported) {
  console.warn('IndexedDB not supported - using memory cache only');
}
```

### Issue: Stale Data

```typescript
// Manually trigger sync
const stateManager = getGlobalMasterDataState();
await stateManager.syncTable('countries');

// Or clear and refresh
await stateManager.clearAllCaches();
const data = await stateManager.getData('countries');
```

### Issue: Memory Leaks

```typescript
// Always cleanup on unmount
useEffect(() => {
  return () => {
    stateManager.destroy();
  };
}, [stateManager]);
```

---

## Best Practices

1. **Initialize Early**: Setup state management on app load
2. **Register All Tables**: Register all master tables upfront
3. **Use Appropriate Caching**: Balance freshness vs performance
4. **Monitor Sync**: Listen to sync events for debugging
5. **Handle Errors**: Always handle error state in UI
6. **Clean Up**: Destroy manager on app unmount
7. **Version Headers**: Always send version headers from server
8. **Reasonable TTL**: Set appropriate sync intervals

---

## Security Considerations

- ✅ All data stored in IndexedDB is scoped to origin
- ✅ No sensitive data should be in master tables
- ✅ Use HTTPS for all master data endpoints
- ✅ Validate data on both client and server
- ✅ Clear cache on logout

---

## Performance Metrics

Typical performance in a browser:

```
Memory Cache Lookup:  < 1ms
IndexedDB Query:      5-20ms
Network Fetch:        100-500ms
Background Sync:      100-500ms (non-blocking)
```

---

## Conclusion

This state management system provides a robust, production-ready solution for managing master data in MFE applications. It combines the benefits of multiple caching layers, background sync, and event-driven architecture to deliver both performance and consistency.

**Happy state managing! 🚀**
