# MFE Framework - Technical Design Document

**Document Version:** 1.0.0  
**Status:** Published  
**Last Updated:** 2024  
**Classification:** Technical Architecture

---

## Executive Summary

This document provides a comprehensive low-level technical design for the Micro Frontend (MFE) Framework. It details the architecture, components, data flows, and implementation specifics for developers and architects.

### Document Scope

- **In Scope:** Framework architecture, core modules, APIs, data structures, communication patterns
- **Out of Scope:** Application-specific business logic, third-party integrations (beyond framework usage)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Host Application                         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │            React SPA (Vite + TypeScript)              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │ MFE Host Ui  │  │   Router     │  │   Theme    │ │ │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │           MFE Framework Core (Shared)                 │ │
│  │  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌────────┐ │ │
│  │  │ Runtime  │  │ Loader  │  │ Registry │  │ Events │ │ │
│  │  └──────────┘  └─────────┘  └──────────┘  └────────┘ │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │       HTTP API Framework (Type-Safe)            │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌────────┐         ┌─────────┐         ┌──────────┐
    │ MFE 1  │         │ MFE 2   │         │ MFE N    │
    │        │         │         │         │          │
    │React +  │       │React +   │       │React +    │
    │TypeScript│      │TypeScript│      │TypeScript │
    └────────┘       └─────────┘       └──────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                    ┌──────────────┐
                    │ Express API  │
                    │ Server       │
                    │ /api/mfe/*   │
                    └──────────────┘
```

### 1.2 Layered Architecture

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (React Components, UI, Routing)        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Application Layer                  │
│  (Business Logic, Event Handling)       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│       Framework Layer                   │
│  - Runtime Manager                      │
│  - Event Bus                            │
│  - Registry System                      │
│  - Module Loader                        │
│  - HTTP API Client                      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│       Infrastructure Layer              │
│  - DOM Manipulation                     │
│  - Network Calls                        │
│  - Local Storage                        │
│  - Script Injection                     │
└─────────────────────────────────────────┘
```

---

## 2. Core Components

### 2.1 Module Loader

#### Purpose
Dynamically loads MFE modules at runtime with automatic retry logic, caching, and timeout handling.

#### Class: `ModuleLoader`

**Location:** `shared/mfe/module-loader.ts`

**Key Methods:**

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `load()` | `(url: string, scope: string, options?: LoaderOptions) => Promise<MFEModule>` | `Promise<MFEModule>` | Load module from remote URL with retry logic |
| `unload()` | `(url: string, scope: string) => Promise<void>` | `Promise<void>` | Unload module and cleanup |
| `preload()` | `(url: string, scope: string) => Promise<void>` | `Promise<void>` | Preload without executing |
| `getCacheSize()` | `() => number` | `number` | Get cached modules count |
| `clearCache()` | `() => Promise<void>` | `Promise<void>` | Clear all cached modules |

**Internal Implementation:**

```
┌─────────────────────────────────────────┐
│        load(url, scope, options)       │
└────────┬────────────────────────────────┘
         │
         ├─→ Check Cache ──→ Return if found
         │
         ├─→ Check Loading ──→ Return existing promise
         │
         └─→ _loadWithRetry()
            │
            ├─→ Attempt 1 ──→ Success → Cache → Return
            │     ↓
            │  Failure
            │     ↓
            ├─→ Wait (Exponential Backoff)
            │
            ├─→ Attempt 2, 3, N...
            │
            └─→ All retries failed → Throw Error
```

**Retry Logic:**

```
Attempt | Delay | Total Wait
--------|-------|----------
   1    |  -    |    0ms
   2    | 100ms |  100ms
   3    | 300ms |  400ms
   4    | 1000ms|  1400ms
```

**Data Structures:**

```typescript
interface LoadedModule {
  module: MFEModule;
  loadedAt: number;        // Timestamp
  retries: number;
}

interface LoaderOptions {
  timeout?: number;        // Default: 30000ms
  retry?: number;          // Default: 3
  fallback?: React.ComponentType<any>;
}
```

#### Caching Strategy

- **Cache Key:** `${url}::${scope}`
- **Cache Type:** In-memory Map
- **Cache Lifetime:** Session (until unload)
- **Max History Size:** 100 modules
- **Eviction:** LRU (Least Recently Used)

#### Error Handling

```typescript
// Error Types:
- "Failed to load script from {url}"
- "Module {scope} not found after loading"
- "Module loading timeout after {timeout}ms"

// Retry Conditions:
- Network timeout
- Script load failure
- Module not available
```

---

### 2.2 Event Bus

#### Purpose
Provides cross-MFE communication without direct dependencies using a pub/sub pattern.

#### Class: `EventBus`

**Location:** `shared/mfe/event-bus.ts`

**Key Methods:**

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `on()` | `(eventType: string, listener: EventListener) => EventSubscription` | `EventSubscription` | Subscribe to specific event |
| `onPattern()` | `(pattern: RegExp, listener: EventListener) => EventSubscription` | `EventSubscription` | Subscribe with regex pattern |
| `once()` | `(eventType: string, listener: EventListener) => EventSubscription` | `EventSubscription` | Subscribe once then unsubscribe |
| `emit()` | `(eventType: string, data?: any, sourceId?: string) => void` | `void` | Emit event to listeners |
| `getHistory()` | `(eventType?: string, limit?: number) => EventPayload[]` | `EventPayload[]` | Get event history |
| `getListenerCount()` | `(eventType: string) => number` | `number` | Get listener count |
| `removeAllListeners()` | `(eventType?: string) => void` | `void` | Remove listeners |

**Event Flow:**

```
emit('user:login', {username: 'john'})
              ↓
    ┌─────────────────────┐
    │ Create EventPayload │
    │ - type             │
    │ - source           │
    │ - timestamp        │
    │ - data             │
    └────────┬────────────┘
             │
    ┌────────▼──────────────────┐
    │ Add to Event History       │
    │ (Max 100 events)          │
    └────────┬───────────────────┘
             │
    ┌────────▼─────────────────────────────────┐
    │ Notify Direct Listeners                  │
    │ listeners.get('user:login').forEach(...) │
    └────────┬──────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────────┐
    │ Notify Pattern Listeners                 │
    │ patternListeners matching 'user:*'       │
    └──────────────────────────────────────────┘
```

**Data Structures:**

```typescript
interface EventPayload {
  type: string;           // Event type/name
  source: string;         // Source MFE ID
  timestamp: number;      // Unix timestamp
  data?: any;            // Event data
}

interface EventSubscription {
  unsubscribe: () => void;
}

type EventListener = (payload: EventPayload) => void;
```

**Pattern Matching Examples:**

```typescript
// Subscribe to all user events
eventBus.onPattern(/^user:/, listener);

// Subscribe to all events
eventBus.onPattern(/.*/,listener);

// Subscribe to specific nested events
eventBus.onPattern(/^user:profile:/, listener);
```

**Memory Management:**

```
┌─────────────────────────┐
│ Event History (Max 100) │
├─────────────────────────┤
│ Event 100 (latest)      │
│ Event 99                │
│ ...                     │
│ Event 1 (oldest)        │
│ [Event 0 discarded]     │
└─────────────────────────┘

When new event added and size > 100:
  → Shift oldest event out (FIFO)
  → Add new event at end
```

**Error Isolation:**

```typescript
// If one listener throws, others continue
listeners.forEach((listener) => {
  try {
    listener(payload);
  } catch (error) {
    console.error(`Error in listener:`, error);
    // Continue with next listener
  }
});
```

---

### 2.3 MFE Runtime

#### Purpose
Manages MFE lifecycle including registration, loading, mounting, and cleanup.

#### Class: `MFERuntime`

**Location:** `shared/mfe/runtime.ts`

**Key Methods:**

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `registerContainer()` | `(id: string, config: MFEConfig) => MFEContainer` | `MFEContainer` | Register new MFE container |
| `loadModule()` | `(id: string, config: MFEConfig) => Promise<MFEContainer>` | `Promise<MFEContainer>` | Load MFE module |
| `unloadModule()` | `(id: string) => Promise<void>` | `Promise<void>` | Unload MFE |
| `mountModule()` | `(id: string, target: HTMLElement \| string) => void` | `void` | Mount to DOM |
| `unmountModule()` | `(id: string) => void` | `void` | Unmount from DOM |
| `getContainer()` | `(id: string) => MFEContainer \| undefined` | `MFEContainer \| undefined` | Get container |
| `getAllContainers()` | `() => MFEContainer[]` | `MFEContainer[]` | Get all containers |
| `isLoaded()` | `(id: string) => boolean` | `boolean` | Check if loaded |
| `cleanup()` | `() => Promise<void>` | `Promise<void>` | Cleanup all modules |
| `getStats()` | `() => RuntimeStats` | `RuntimeStats` | Get statistics |

**MFE Lifecycle State Machine:**

```
                    ┌─────────────────┐
                    │   Unregistered  │
                    └────────┬────────┘
                             │
                    registerContainer()
                             │
                             ▼
                    ┌─────────────────┐
                    │   Registered    │
                    │  (not loaded)   │
                    └────────┬────────┘
                             │
                     loadModule()
                             │
                             ▼
                    ┌─────────────────┐
                    │     Loading     │ ◄──┐
                    │    (pending)    │   │
                    └────────┬────────┘   │
                             │           │
                    ┌────────▼────────┐   │
                    │   Success?      │   │
                    └────┬──────┬─────┘   │
                        Yes    No────────┘
                         │
                         ▼
                    ┌─────────────────┐
                    │     Loaded      │
                    │  (ready)        │
                    └────────┬────────┘
                             │
                   mountModule()
                             │
                             ▼
                    ┌─────────────────┐
                    │     Mounted     │
                    │  (active)       │
                    └────────┬────────┘
                             │
                  unmountModule() / unloadModule()
                             │
                             ▼
                    ┌─────────────────┐
                    │   Unregistered  │
                    │   (cleanup)     │
                    └─────────────────┘
```

**Container Data Structure:**

```typescript
interface MFEContainer {
  id: string;
  name: string;
  loaded: boolean;
  component?: React.ComponentType<any>;
  manifest?: MFEManifest;
}

interface MFEConfig {
  id: string;
  scope: string;
  module: string;
  remoteEntry?: string;
  exposes: Record<string, string>;
}

interface MFEManifest {
  name: string;
  version: string;
  scope: string;
  module: string;
  remoteEntry?: string;
  exposes: Record<string, string>;
  shared?: Record<string, SharedDependency>;
  loaded?: boolean;
}
```

**Event Emissions:**

```typescript
// Registration
eventBus.emit('mfe:container:registered', { id, config });

// Loading
eventBus.emit('mfe:loading:start', { id, config });
eventBus.emit('mfe:loading:complete', { id, container });
eventBus.emit('mfe:loading:error', { id, error });

// Mounting
eventBus.emit('mfe:mounted', { id, target });
eventBus.emit('mfe:unmounted', { id });

// Unloading
eventBus.emit('mfe:unloading:start', { id });
eventBus.emit('mfe:unloading:complete', { id });
eventBus.emit('mfe:unloading:error', { id, error });
```

**Automatic Cleanup:**

```typescript
// On page unload/navigation
window.addEventListener('beforeunload', async () => {
  await runtime.cleanup();
  // All modules are unloaded
  // All listeners are removed
  // All resources freed
});
```

---

### 2.4 Registry System

#### Purpose
Central registry for MFE discovery, search, and metadata management.

#### Class: `MFERegistry`

**Location:** `shared/mfe/registry.ts`

**Key Methods:**

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `register()` | `(entry: RegistryEntry) => void` | `void` | Register MFE entry |
| `unregister()` | `(id: string) => void` | `void` | Remove MFE entry |
| `get()` | `(id: string) => RegistryEntry \| undefined` | `RegistryEntry \| undefined` | Get by ID |
| `getAll()` | `() => RegistryEntry[]` | `RegistryEntry[]` | Get all entries |
| `findByTag()` | `(tag: string) => RegistryEntry[]` | `RegistryEntry[]` | Find by tag |
| `findByName()` | `(name: string) => RegistryEntry[]` | `RegistryEntry[]` | Find by name (partial) |
| `search()` | `(query: string) => RegistryEntry[]` | `RegistryEntry[]` | Full-text search |
| `getConfig()` | `(id: string) => MFEConfig \| undefined` | `MFEConfig \| undefined` | Get MFE config |
| `loadRemoteRegistry()` | `() => Promise<void>` | `Promise<void>` | Load from remote URL |
| `export()` | `() => RegistryEntry[]` | `RegistryEntry[]` | Export all entries |
| `import()` | `(entries: RegistryEntry[]) => void` | `void` | Import entries |
| `getTags()` | `() => string[]` | `string[]` | Get all unique tags |
| `validateEntry()` | `(entry: RegistryEntry) => string[]` | `string[]` | Validate entry |

**Search Algorithm:**

```
search(query: string) → RegistryEntry[]
  │
  ├─ Lowercase query
  │
  ├─ For each entry:
  │   ├─ Check name.includes(query) ?
  │   ├─ Check description.includes(query) ?
  │   └─ Check tags.includes(query) ?
  │
  └─ Return matching entries

// Examples:
search('dash') → [dashboard, ...]
search('analytics') → [analytics, ...]
search('user') → [user-mgmt, user-profile, ...]
```

**Data Structure:**

```typescript
interface RegistryEntry {
  id: string;
  name: string;
  description: string;
  version: string;
  scope: string;
  module: string;
  tags: string[];
  icon?: string;
  config: MFEConfig;
}
```

**Registry Storage:**

```
┌─────────────────────────────────┐
│   Map<string, RegistryEntry>    │
├─────────────────────────────────┤
│ Key: 'dashboard'                │
│ Value: { id, name, config, ... }│
├─────────────────────────────────┤
│ Key: 'analytics'                │
│ Value: { id, name, config, ... }│
├─────────────────────────────────┤
│ Key: 'settings'                 │
│ Value: { id, name, config, ... }│
└─────────────────────────────────┘
```

**Event Emissions:**

```typescript
eventBus.emit('registry:entry:registered', { id, entry });
eventBus.emit('registry:entry:unregistered', { id });
eventBus.emit('registry:loaded', { count });
eventBus.emit('registry:load:error', { error });
eventBus.emit('registry:cleared', {});
```

---

### 2.5 HTTP API Framework

#### Purpose
Type-safe HTTP client with automatic retry, timeout, and error handling.

#### Class: `HttpApi`

**Location:** `shared/mfe/http-api.ts`

**Key Methods:**

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `request()` | `<T>(url: string, options?: ApiRequestOptions) => Promise<ApiResponse<T>>` | `Promise<ApiResponse<T>>` | Make HTTP request |
| `get()` | `<T>(url: string, options?: ApiRequestOptions) => Promise<ApiResponse<T>>` | `Promise<ApiResponse<T>>` | GET request |
| `post()` | `<T>(url: string, body?: any, options?: ApiRequestOptions) => Promise<ApiResponse<T>>` | `Promise<ApiResponse<T>>` | POST request |
| `put()` | `<T>(url: string, body?: any, options?: ApiRequestOptions) => Promise<ApiResponse<T>>` | `Promise<ApiResponse<T>>` | PUT request |
| `patch()` | `<T>(url: string, body?: any, options?: ApiRequestOptions) => Promise<ApiResponse<T>>` | `Promise<ApiResponse<T>>` | PATCH request |
| `delete()` | `<T>(url: string, options?: ApiRequestOptions) => Promise<ApiResponse<T>>` | `Promise<ApiResponse<T>>` | DELETE request |
| `setBaseUrl()` | `(url: string) => void` | `void` | Set base URL |
| `setDefaultHeaders()` | `(headers: Record<string, string>) => void` | `void` | Set default headers |
| `addHeader()` | `(key: string, value: string) => void` | `void` | Add header |
| `removeHeader()` | `(key: string) => void` | `void` | Remove header |

**Request Pipeline:**

```
request(url, options)
  │
  ├─ Emit 'api:request:start' event
  │
  ├─ Resolve full URL
  │   ├─ If absolute (https://...) → use as-is
  │   └─ If relative → prepend baseUrl
  │
  ├─ Merge options with defaults
  │
  ├─ _performRequest(url, opts)
  │   │
  │   ├─ Create AbortController
  │   ├─ Set timeout timer
  │   │
  │   ├─ fetch(url, {
  │   │   method, headers, body, signal
  │   │ })
  │   │
  │   ├─ On success → Clear timer → Return response
  │   ├─ On failure → Exponential backoff
  │   │   ├─ Attempt 1: 0ms delay
  │   │   ├─ Attempt 2: 100ms delay
  │   │   ├─ Attempt 3: 300ms delay
  │   │   └─ Attempt 4+: 5000ms max delay
  │   │
  │   └─ After all retries fail → Throw error
  │
  ├─ Parse response
  │   ├─ If JSON → JSON.parse()
  │   ├─ If text → response.text()
  │   └─ If blob → response.blob()
  │
  ├─ Create ApiResponse object
  │   ├─ status, statusText, data, headers, ok
  │
  ├─ Check response.ok
  │   ├─ If false → Emit 'api:request:error' → Throw
  │   └─ If true → Emit 'api:request:success' → Return
  │
  └─ Return ApiResponse<T>
```

**Data Structures:**

```typescript
interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;        // Default: 30000ms
  retry?: number;          // Default: 3
  signal?: AbortSignal;
}

interface ApiResponse<T = any> {
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
  ok: boolean;
}

interface ApiError extends Error {
  status?: number;
  statusText?: string;
  response?: Response;
}
```

**Timeout & Retry Logic:**

```
Timeout: 30 seconds per request
Retry attempts: 3
Retry delays:
  - Attempt 1: Immediate
  - Attempt 2: 100ms
  - Attempt 3: 300ms
  - Attempt 4: 5000ms

Total max time: (3 × 30s) + 5.4s = ~95 seconds
```

**Event Emissions:**

```typescript
eventBus.emit('api:request:start', { url, method });
eventBus.emit('api:request:success', { url, status });
eventBus.emit('api:request:error', { url, error });
eventBus.emit('api:request:failed', { url, error });
```

---

## 3. Data Flow Diagrams

### 3.1 MFE Loading Flow

```
┌─────────────────────────────────────────────────────────┐
│ User clicks "Load" on MFE in Registry                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────────┐
         │ Get MFE from Registry     │
         │ (Get config/metadata)     │
         └────────────┬──────────────┘
                      │
                      ▼
         ┌───────────────────────────┐
         │ Runtime.loadModule()      │
         └────────────┬──────────────┘
                      │
              ┌───────┴────────┐
              │                │
              ▼                ▼
    ┌──────────────────┐  ┌─────────────────┐
    │ Has remoteEntry? │  │ Local component?│
    └────┬─────────────┘  └────────┬────────┘
         │                         │
        YES                       YES
         │                         │
         ▼                         ▼
    ┌──────────────────┐  ┌─────────────────┐
    │ModuleLoader.load()│  │Mark as loaded   │
    │(Download script)  │  │(No download)    │
    └────┬──────────────┘  └────────┬────────┘
         │                          │
         ├──────────────────────────┘
         │
         ▼
    ┌──────────────────┐
    │Check cache       │
    │for module        │
    └────┬─────────────┘
         │
    ┌────┴────┐
    │          │
   Found    Not Found
    │          │
    ▼          ▼
  Return   Fetch script
            from URL
             │
             ▼
         ┌──────────────┐
         │Inject into   │
         │DOM           │
         └────┬─────────┘
              │
              ▼
         ┌──────────────┐
         │Wait for load │
         │event         │
         └────┬─────────┘
              │
         ┌────┴────┐
         │          │
      Success    Failure
         │          │
         ▼          ▼
      Cache     Retry or
      Module    Throw Error
         │          │
         └──────┬───┘
                │
                ▼
    ┌──────────────────────┐
    │Runtime: Container    │
    │loaded = true         │
    │Emit: loading:complete│
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │MFE Host: Re-render   │
    │Show loaded MFE       │
    └──────────────────────┘
```

### 3.2 Event Communication Flow

```
MFE 1: Dashboard              Event Bus                 MFE 2: Notifications
(Publisher)                   (Central)                 (Subscriber)

emit('user:login', {
  email: 'john@example.com'
})
   │
   │
   ├─→ Create EventPayload
   │   ├─ type: 'user:login'
   │   ├─ source: 'dashboard'
   │   ├─ timestamp: 1234567890
   │   └─ data: { email: '...' }
   │
   ├─→ Store in history
   │
   ├─→ Notify listeners
   │   │
   │   ├─→ listeners.get('user:login')
   │   │   │
   │   │   └─→ Listener callback
   │   │       │
   │   │       ├─→ Handle event
   │   │       │
   │   │       └─→ Emit 'notification'
   │   │           event
   │   │
   │   └─→ Notify pattern listeners
   │       /^user:.*/
   │       │
   │       └─→ Pattern matching listeners
   │           │
   │           └─→ Handle event
   │
   └─→ MFE 2 receives event
       │
       ├─→ Show notification
       │   "User john@example.com logged in"
       │
       └─→ Update UI accordingly
```

### 3.3 API Request Flow

```
Component calls:
api.post('/users', { name: 'John' })
   │
   ▼
┌──────────────────────┐
│ Resolve full URL     │
│ /api/users →         │
│ https://api.x/api/.. │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Merge options with   │
│ defaults             │
│ timeout: 30000       │
│ retry: 3             │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Emit: api:request:   │
│ start event          │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐      ┌─────────────────┐
│ fetch(url, options)  │──→   │ Network timeout?│
└────┬─────────────────┘      │ Request failed? │
     │                        └────────┬────────┘
     │                                 │
  ┌──┴────────────────────────────────┐
  │                                   │
  ▼ Success                           ▼ Failure
  │                           ┌───────────────────┐
  │                           │ Wait (backoff)    │
  │                           │ 100-5000ms        │
  │                           └────────┬──────────┘
  │                                    │
  │                           ┌────────▼──────────┐
  │                           │ Retry? (attempt<3)│
  │                           └────┬────────┬─────┘
  │                               Yes       No
  │                                │        │
  │                         ┌──────┘        │
  │                         │               │
  │                         ▼        ┌──────▼──────┐
  │                    Retry     Throw error
  │                     loop
  │
  ▼
┌──────────────────────┐
│ Parse response       │
│ - JSON               │
│ - Text               │
│ - Blob               │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Create ApiResponse   │
│ {status, data, ok}   │
└────────┬─────────────┘
         │
    ┌────┴─────┐
    │           │
 ok=true     ok=false
    │           │
    ▼           ▼
Emit       Emit error
success    event
event      Throw ApiError
    │           │
    └─────┬─────┘
          │
          ▼
    Return/Throw
```

---

## 4. API Specifications

### 4.1 Server API Endpoints

**Base URL:** `/api`

#### Registry Endpoints

**1. List all MFEs**
```
GET /api/mfe/registry
Response: {
  entries: RegistryEntry[],
  total: number
}
Status Codes:
  - 200: Success
  - 500: Server error
```

**2. Get specific MFE**
```
GET /api/mfe/registry/:id
Response: RegistryEntry
Status Codes:
  - 200: Success
  - 404: Not found
  - 500: Server error
```

**3. Search MFEs**
```
GET /api/mfe/registry/search?q=query&tag=tag_name
Query Parameters:
  - q: Search query (optional)
  - tag: Filter by tag (optional)
Response: {
  entries: RegistryEntry[],
  total: number
}
Status Codes:
  - 200: Success
  - 500: Server error
```

**4. Get all tags**
```
GET /api/mfe/tags
Response: { tags: string[] }
Status Codes:
  - 200: Success
  - 500: Server error
```

### 4.2 Type Definitions

**Server Types** (`shared/api.ts`):

```typescript
interface RegistryListResponse {
  entries: Array<{
    id: string;
    name: string;
    description: string;
    version: string;
    tags: string[];
    icon?: string;
  }>;
  total: number;
}

interface RegistryEntryResponse {
  id: string;
  name: string;
  description: string;
  version: string;
  scope: string;
  module: string;
  tags: string[];
  icon?: string;
  config: {
    id: string;
    scope: string;
    module: string;
    remoteEntry?: string;
    exposes: Record<string, string>;
  };
}

interface MFEMetrics {
  mfeId: string;
  loadTime: number;
  timestamp: number;
  success: boolean;
  errorMessage?: string;
}

interface MFEHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  loadedMFEs: number;
  totalMFEs: number;
  metrics: MFEMetrics[];
}
```

---

## 5. Error Handling Strategy

### 5.1 Error Types & Codes

| Error Type | Code | Severity | Retry | Description |
|-----------|------|----------|-------|-------------|
| ModuleNotFound | MNF-001 | HIGH | Yes | MFE script not found |
| LoadTimeout | LT-001 | HIGH | Yes | Module loading exceeded timeout |
| InvalidConfig | IC-001 | MEDIUM | No | MFE config invalid |
| NetworkError | NE-001 | HIGH | Yes | Network/fetch failure |
| ParseError | PE-001 | MEDIUM | No | Failed to parse response |
| ListenerError | LE-001 | LOW | No | Event listener threw error |

### 5.2 Error Recovery

```
Error Detection
    │
    ├─ Retryable? (Network, Timeout)
    │   ├─ YES → Exponential backoff retry
    │   │        (Max 3 retries)
    │   │
    │   └─ NO → Emit error event
    │           → User notification
    │           → Log error
    │           → Return error response
    │
    └─ Recoverable? (Graceful degradation)
        ├─ YES → Fallback component
        │        → Continue execution
        │
        └─ NO → Error boundary catch
                → Component isolates error
                → Rest of app continues
```

### 5.3 Logging Strategy

```
Log Levels:
- ERROR: Critical failures (loading failed)
- WARN: Non-critical issues (slow load)
- INFO: Important events (loaded, unloaded)
- DEBUG: Detailed trace (retry attempts)

Log Format:
[LEVEL] [TIMESTAMP] [SOURCE] MESSAGE
[ERROR] 2024-01-15 12:30:45 ModuleLoader Module dashboard failed to load
```

---

## 6. Performance Considerations

### 6.1 Module Loading Performance

**Metrics to Monitor:**

```
1. Load Time: Duration to download + initialize
   - Target: < 5 seconds
   - Warning: > 10 seconds
   - Critical: > 30 seconds

2. Cache Hit Rate: Modules loaded from cache
   - Target: > 80%
   - Warning: < 50%

3. Memory Usage: Module cache size
   - Target: < 50MB
   - Warning: > 100MB

4. Error Rate: Failed load attempts
   - Target: < 2%
   - Warning: > 5%
```

**Optimization Techniques:**

```
1. Code Splitting
   - Lazy load heavy components
   - React.lazy() for routes

2. Caching
   - Browser cache headers
   - Service Worker caching
   - Runtime cache (ModuleLoader)

3. Preloading
   - moduleLoader.preload()
   - Link preload headers

4. Compression
   - GZIP compression
   - Minification
   - Tree shaking
```

### 6.2 Memory Management

```
┌─────────────────────────────────┐
│ Module Cache (Max ~50MB)        │
├─────────────────────────────────┤
│ Module 1: 2MB                   │
│ Module 2: 1.5MB                 │
│ Module 3: 3MB                   │
│ ...                             │
│ Total: ~45MB                    │
└─────────────────────────────────┘

Event History (Max 100 events)
- Each event: ~1KB
- Max history: ~100KB

Listeners Map
- Per listener: ~500 bytes
- Typical: 10-50 listeners
- Total: 5-25KB
```

### 6.3 Bundle Size Analysis

**Current Build Sizes:**

```
Client Build:
- index.html: 0.41 KB
- index.css: 74.38 KB (gzip: 12.69 KB)
- index.js: 561.52 KB (gzip: 170.26 KB)

Server Build:
- node-build.mjs: 13.76 KB

Total Gzip: ~196 KB
```

**Optimization Opportunities:**

```
1. Code Splitting
   - Split dashboard, analytics, settings
   - Expected reduction: 30-40%

2. Tree Shaking
   - Remove unused dependencies
   - Expected reduction: 10-15%

3. Lazy Loading
   - Defer heavy libraries
   - Expected reduction: 20-25%

Target: < 150KB gzip
```

---

## 7. Scalability & Extensibility

### 7.1 Horizontal Scaling

```
Load Balancer
    │
    ├─→ Server Instance 1
    │   ├─ Express Server
    │   └─ MFE Registry (shared state)
    │
    ├─→ Server Instance 2
    │   ├─ Express Server
    │   └─ MFE Registry (synced)
    │
    └─→ Server Instance N
        ├─ Express Server
        └─ MFE Registry (synced)

Considerations:
- Registry sync (Redis/shared DB)
- Session affinity not required
- Stateless design
```

### 7.2 Adding New MFEs

**To register a new MFE:**

1. Create component: `client/components/mfe-samples/NewMFE.tsx`
2. Add to componentMap in `client/components/MFEHost.tsx`
3. Register in registry: `shared/mfe/registry.ts`
4. Deploy and restart

**No changes needed to:**
- Runtime
- Event Bus
- Module Loader
- Core framework

### 7.3 Custom Plugins

```typescript
// Custom event handler plugin
class CustomEventPlugin {
  constructor(private eventBus: EventBus) {}

  initialize() {
    this.eventBus.on('plugin:init', (payload) => {
      // Custom logic
    });
  }
}

// Custom API interceptor
class ApiInterceptor {
  constructor(private api: HttpApi) {}

  addAuthToken(token: string) {
    this.api.addHeader('Authorization', `Bearer ${token}`);
  }
}
```

---

## 8. Security Considerations

### 8.1 XSS Prevention

```
✅ Safe:
- React JSX (auto-escapes)
- dangerouslySetInnerHTML (explicitly marked)

❌ Unsafe:
- eval()
- innerHTML from user input
- window[userInput]

Mitigation:
- Content Security Policy (CSP)
- Input validation
- Output encoding
```

### 8.2 CSRF Protection

```
Mitigation:
- CSRF tokens in forms
- SameSite cookie flag
- Custom headers (X-CSRF-Token)
- POST/PUT/DELETE verification
```

### 8.3 Script Injection Prevention

```
Module Loader Security:
- Only load from trusted origins
- Validate script signature
- Use Subresource Integrity (SRI)
- CORS verification

Script tag:
<script
  src="https://cdn.example.com/mfe.js"
  integrity="sha384-..."
  crossorigin="anonymous"
></script>
```

### 8.4 Data Protection

```
Sensitive Data:
- Never in localStorage without encryption
- Use httpOnly cookies for tokens
- Encrypt in transit (HTTPS)
- Validate server-side

API Keys:
- Use environment variables
- Rotate regularly
- Use short-lived tokens (JWT)
```

---

## 9. Testing Strategy

### 9.1 Unit Testing

```
Tests per component:
- ModuleLoader: Load, cache, retry logic
- EventBus: Emit, subscribe, patterns
- Runtime: Register, load, unload
- Registry: Add, search, filter
- HttpApi: Request, retry, timeout

Framework: Vitest
Coverage Target: >80%
```

### 9.2 Integration Testing

```
Test Scenarios:
1. Load MFE with remote script
2. Load MFE from local component
3. Event communication between MFEs
4. API calls with retry
5. Registry search and filtering
6. Error handling and recovery

Framework: Vitest + React Testing Library
```

### 9.3 E2E Testing

```
Test Scenarios:
1. Load homepage
2. Click "View Demo"
3. Load Dashboard MFE
4. Load Analytics MFE
5. Verify event communication
6. Load Settings MFE
7. Verify error handling

Framework: Playwright/Cypress
```

---

## 10. Deployment & DevOps

### 10.1 Build Pipeline

```
Source Code
    │
    ├─→ lint (TypeScript check)
    ├─→ test (Unit + Integration)
    ├─→ build:client
    │   ├─ Vite bundle
    │   ├─ Output: dist/spa/
    │   └─ Artifacts: *.js, *.css, *.html
    │
    ├─→ build:server
    │   ├─ Vite SSR build
    │   ├─ Output: dist/server/
    │   └─ Artifacts: *.mjs, *.map
    │
    └─→ Artifacts ready for deployment
```

### 10.2 Deployment Targets

```
1. Netlify/Vercel
   - Auto-deploy from Git
   - Edge functions support
   - CDN distribution

2. Docker
   - Containerized deployment
   - Kubernetes ready
   - Multi-environment support

3. Traditional Hosting
   - Static site hosting (dist/spa)
   - Node.js server hosting (dist/server)
   - Nginx reverse proxy
```

### 10.3 Environment Configuration

```
.env.development:
  VITE_API_BASE_URL=http://localhost:8080/api
  DEBUG=true

.env.staging:
  VITE_API_BASE_URL=https://api-staging.example.com
  DEBUG=false

.env.production:
  VITE_API_BASE_URL=https://api.example.com
  DEBUG=false
```

---

## 11. Monitoring & Observability

### 11.1 Metrics to Track

```
Application Metrics:
- Page load time
- Time to interactive (TTI)
- First contentful paint (FCP)
- MFE load success rate
- MFE load duration
- Event bus message count
- API request latency
- Error rate by type

Runtime Metrics:
- Memory usage
- CPU usage
- Network bandwidth
- Cache hit rate
```

### 11.2 Error Tracking

```
Error Information:
- Error type/code
- Stack trace
- MFE source
- Timestamp
- User session
- Browser/OS
- Network conditions

Tools:
- Sentry / LogRocket
- DataDog / New Relic
- CloudWatch / Stackdriver
```

---

## 12. Maintenance & Support

### 12.1 Code Maintenance

```
Regular Tasks:
- Dependencies update
- Security patches
- Performance optimization
- Code refactoring
- Documentation updates

Frequency:
- Weekly: Dependency check
- Monthly: Security audit
- Quarterly: Performance review
```

### 12.2 Backward Compatibility

```
Versioning: Semantic (MAJOR.MINOR.PATCH)

Breaking Changes:
- Require MAJOR version bump
- Provide deprecation notices
- Support grace period (2+ versions)
- Clear migration guide

Non-breaking:
- MINOR/PATCH versions
- No migration needed
```

---

## 13. Glossary

| Term | Definition |
|------|-----------|
| MFE | Micro Frontend - Independent modular application |
| Host | Main application containing MFEs |
| Registry | Central MFE discovery system |
| Event Bus | Pub/sub system for cross-MFE communication |
| Module Loader | Runtime module loading system |
| Runtime | MFE lifecycle management system |
| Container | MFE instance wrapper in runtime |
| Manifest | MFE metadata and configuration |
| Scope | Unique namespace for MFE module |
| Expose | API surface exposed by MFE |

---

## 14. References & Resources

- React Documentation: https://react.dev
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- Vite Documentation: https://vitejs.dev
- Express Documentation: https://expressjs.com
- Web Components: https://developer.mozilla.org/en-US/docs/Web/Web_Components

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-15 | Initial release |

---

**Document Status:** ✅ Published  
**Last Review:** 2024-01-15  
**Next Review:** 2024-04-15

---

*For questions or clarifications, please contact the MFE Framework team.*
