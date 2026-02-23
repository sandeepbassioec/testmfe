# MFE Framework - Complete Developer Guide

A comprehensive guide for developers to build and deploy Micro Frontend (MFE) applications using this enterprise-grade framework.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Prerequisites](#prerequisites)
3. [Project Setup](#project-setup)
4. [Creating Your First MFE](#creating-your-first-mfe)
5. [MFE Structure](#mfe-structure)
6. [Core Concepts](#core-concepts)
7. [API Integration](#api-integration)
8. [Event Communication](#event-communication)
9. [Registry System](#registry-system)
10. [Advanced Patterns](#advanced-patterns)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)
14. [Tips & Tricks](#tips--tricks)
15. [Complete Examples](#complete-examples)

---

## Getting Started

### What is a Micro Frontend?

A Micro Frontend is a modular application component that can be independently developed, tested, and deployed. This framework allows you to build multiple independent MFEs that can be dynamically loaded into a host application.

### Framework Architecture

```
Host Application
├── MFE Runtime (Manages module lifecycle)
├── Event Bus (Cross-MFE communication)
├── Module Loader (Dynamic module loading)
├── Registry (MFE discovery)
└── HTTP API Framework (Type-safe API calls)
```

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** v18+ installed
- **pnpm** package manager (v10+)
- **TypeScript** knowledge (basic)
- **React** familiarity (v18+)
- **Git** for version control

### Check Installation

```bash
# Check Node.js version
node --version

# Check pnpm version
pnpm --version

# Output should be v18+ and v10+
```

---

## Project Setup

### 1. Clone or Download the Framework

```bash
# Clone the repository
git clone https://github.com/your-org/mfe-framework.git
cd mfe-framework

# Or download and extract the zip file
```

### 2. Install Dependencies

```bash
# Install all dependencies
pnpm install

# This installs:
# - React, TypeScript, Vite
# - Express.js for backend
# - Recharts for visualizations
# - Lucide React icons
# - TailwindCSS for styling
```

### 3. Verify Installation

```bash
# Run type checking
pnpm typecheck

# Should output: "No errors" or similar

# Run tests
pnpm test

# Should show all tests passing
```

### 4. Start Development Server

```bash
# Start the dev server
pnpm dev

# Output:
# VITE v7.1.2  ready in 500ms
# ➜  local:   http://localhost:8080/

# Open http://localhost:8080 in your browser
```

---

## Creating Your First MFE

### Step 1: Create MFE Directory Structure

```bash
# Create a new MFE directory
mkdir -p client/components/mfe-samples/MyAwesomeMFE

# Navigate to the new directory
cd client/components/mfe-samples/MyAwesomeMFE
```

### Step 2: Create the MFE Component

Create `client/components/mfe-samples/MyAwesomeMFE.tsx`:

```typescript
import React, { useEffect } from 'react';
import { getGlobalEventBus } from '@shared/mfe';

interface MyAwesomeMFEProps {
  title?: string;
  onLoadComplete?: () => void;
}

const MyAwesomeMFE: React.FC<MyAwesomeMFEProps> = ({ 
  title = 'My Awesome MFE',
  onLoadComplete
}) => {
  const eventBus = getGlobalEventBus();

  useEffect(() => {
    // Emit event when MFE loads
    eventBus.emit('mfe:myawesome:loaded', {
      timestamp: new Date().toISOString(),
    });

    // Call callback if provided
    onLoadComplete?.();

    // Cleanup function
    return () => {
      eventBus.emit('mfe:myawesome:unloaded', {
        timestamp: new Date().toISOString(),
      });
    };
  }, [eventBus, onLoadComplete]);

  return (
    <div className="w-full space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-indigo-100">This is my first MFE</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="text-gray-600 text-sm font-medium">Feature 1</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">100%</div>
          <div className="text-green-600 text-sm mt-2">Working perfectly</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="text-gray-600 text-sm font-medium">Feature 2</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">99%</div>
          <div className="text-green-600 text-sm mt-2">Almost there</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="text-gray-600 text-sm font-medium">Feature 3</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">75%</div>
          <div className="text-yellow-600 text-sm mt-2">In progress</div>
        </div>
      </div>
    </div>
  );
};

export default MyAwesomeMFE;
```

### Step 3: Register the MFE in the Host

Update `client/components/MFEHost.tsx` to import and register your MFE:

```typescript
// Add import at the top
import MyAwesomeMFE from './mfe-samples/MyAwesomeMFE';

// Add to componentMap
const componentMap: Record<string, React.ComponentType<any>> = {
  dashboard: Dashboard,
  analytics: Analytics,
  settings: Settings,
  myawesome: MyAwesomeMFE,  // <- Add this line
};
```

### Step 4: Register in the Registry

Update `shared/mfe/registry.ts` to add your MFE:

```typescript
export const SAMPLE_REGISTRY_ENTRIES: RegistryEntry[] = [
  // ... existing entries ...
  
  {
    id: 'myawesome',
    name: 'My Awesome MFE',
    description: 'A custom MFE I created',
    version: '1.0.0',
    scope: 'myawesome',
    module: './MyAwesomeMFE',
    tags: ['custom', 'awesome', 'feature'],
    icon: '⚡',
    config: {
      id: 'myawesome',
      scope: 'myawesome',
      module: 'myawesome',
      exposes: {
        './MyAwesomeMFE': './src/MyAwesomeMFE',
      },
    },
  },
];
```

### Step 5: Test Your MFE

```bash
# From the project root
pnpm dev

# Visit http://localhost:8080
# Click "View Demo"
# You should see your new MFE in the registry
# Click "Load" to load your MFE
```

---

## MFE Structure

### Recommended Directory Layout

```
client/components/mfe-samples/
├── MyAwesomeMFE.tsx          # Main component
├── hooks/
│   ├── useMyData.ts          # Custom hooks
│   └── useMyState.ts
├── utils/
│   ├── helpers.ts            # Utility functions
│   └── constants.ts
├── types/
│   └── index.ts              # TypeScript types
└── styles/
    └── MyAwesomeMFE.css      # Component styles (optional)
```

### File Naming Conventions

```
✓ Good:
- MyAwesomeMFE.tsx
- useUserData.ts
- userHelpers.ts
- types.ts

✗ Avoid:
- my-awesome-mfe.tsx
- useuserdata.ts
- USERHELPERS.ts
```

---

## Core Concepts

### 1. Module Loader

The Module Loader is responsible for dynamically loading MFE modules at runtime.

```typescript
import { getGlobalModuleLoader } from '@shared/mfe';

const loader = getGlobalModuleLoader();

// Load a remote module
const module = await loader.load(
  'https://example.com/module.js', // Remote URL
  'my-mfe-scope',                   // Scope name
  { 
    timeout: 30000,  // 30 seconds
    retry: 3         // Retry 3 times
  }
);

// Preload a module without executing
await loader.preload('https://example.com/module.js', 'scope');

// Unload and cleanup
await loader.unload('https://example.com/module.js', 'scope');

// Get cache statistics
const cacheSize = loader.getCacheSize();
const cacheInfo = loader.getCacheInfo();
```

### 2. Event Bus

The Event Bus enables communication between MFEs without direct dependencies.

```typescript
import { getGlobalEventBus } from '@shared/mfe';

const eventBus = getGlobalEventBus();

// Subscribe to an event
const subscription = eventBus.on('user:login', (payload) => {
  console.log('User logged in:', payload.data.username);
});

// Unsubscribe
subscription.unsubscribe();

// Subscribe with pattern matching
eventBus.onPattern(/^user:/, (payload) => {
  console.log('User event:', payload.type);
});

// Subscribe once
eventBus.once('user:logout', (payload) => {
  console.log('User logged out');
  // Automatically unsubscribed after first call
});

// Emit events
eventBus.emit('user:login', { username: 'john@example.com' });

// Get event history
const history = eventBus.getHistory('user:login', 10); // Last 10 events

// Get listener count
const count = eventBus.getListenerCount('user:login');
```

### 3. MFE Runtime

The Runtime manages the complete lifecycle of MFE modules.

```typescript
import { getGlobalRuntime, MFEConfig } from '@shared/mfe';

const runtime = getGlobalRuntime();

// Create a config for your MFE
const config: MFEConfig = {
  id: 'my-mfe',
  scope: 'myMFE',
  module: 'MyMFE',
  remoteEntry: 'https://example.com/mfe.js', // Optional
  exposes: {
    './MyMFE': './src/MyMFE',
  },
};

// Register a container
const container = runtime.registerContainer('my-mfe', config);

// Load the module
await runtime.loadModule('my-mfe', config);

// Check if loaded
const isLoaded = runtime.isLoaded('my-mfe');

// Mount to DOM
runtime.mountModule('my-mfe', 'target-element-id');

// Unmount from DOM
runtime.unmountModule('my-mfe');

// Unload the module
await runtime.unloadModule('my-mfe');

// Get runtime statistics
const stats = runtime.getStats();
// Output:
// {
//   totalContainers: 5,
//   loadedContainers: 3,
//   mountedContainers: 2
// }
```

### 4. Registry System

The Registry is the central discovery system for all MFEs.

```typescript
import { getGlobalRegistry, type RegistryEntry } from '@shared/mfe';

const registry = getGlobalRegistry();

// Get all registered MFEs
const allMFEs = registry.getAll();

// Get specific MFE
const mfe = registry.get('dashboard');

// Search by name (partial match)
const results = registry.findByName('dash');

// Search by tag
const analyticsMFEs = registry.findByTag('analytics');

// Full text search
const searchResults = registry.search('user management');

// Get all unique tags
const tags = registry.getTags();
// Output: ['analytics', 'dashboard', 'settings', 'user', ...]

// Register a new MFE
const entry: RegistryEntry = {
  id: 'custom-mfe',
  name: 'Custom MFE',
  description: 'My custom MFE',
  version: '1.0.0',
  scope: 'customMFE',
  module: 'CustomMFE',
  tags: ['custom', 'feature'],
  icon: '🎉',
  config: {
    id: 'custom-mfe',
    scope: 'customMFE',
    module: 'customMFE',
    exposes: { './CustomMFE': './src/CustomMFE' },
  },
};

registry.register(entry);

// Unregister an MFE
registry.unregister('custom-mfe');

// Export registry for backup
const backup = registry.export();

// Import registry entries
registry.import(backup);
```

### 5. HTTP API Framework

Type-safe HTTP client for API calls.

```typescript
import { getGlobalHttpApi, type ApiResponse } from '@shared/mfe';

const api = getGlobalHttpApi('https://api.example.com');

// Set default headers
api.setDefaultHeaders({
  'Authorization': 'Bearer YOUR_TOKEN',
  'X-API-Version': 'v1',
});

// GET request
const response: ApiResponse<UserData> = await api.get('/users');
console.log(response.data); // Typed response

// POST request with body
const created = await api.post('/users', {
  name: 'John Doe',
  email: 'john@example.com',
});

// PUT request
const updated = await api.put('/users/123', {
  name: 'Jane Doe',
});

// PATCH request
const patched = await api.patch('/users/123', {
  status: 'active',
});

// DELETE request
await api.delete('/users/123');

// With custom options
const custom = await api.get('/users', {
  timeout: 60000,        // 60 seconds
  retry: 5,              // Retry 5 times
  headers: {
    'X-Custom': 'value',
  },
});

// Handle errors
try {
  const result = await api.get('/users');
  if (!result.ok) {
    console.error(`Error: ${result.status} ${result.statusText}`);
  }
} catch (error) {
  console.error('API call failed:', error);
}

// Add custom header
api.addHeader('X-Request-ID', 'unique-id');

// Remove header
api.removeHeader('X-Request-ID');
```

---

## API Integration

### Example: Creating a User Management MFE with API Calls

```typescript
import React, { useState, useEffect } from 'react';
import { getGlobalHttpApi, getGlobalEventBus } from '@shared/mfe';

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const UserManagementMFE: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = getGlobalHttpApi('/api');
  const eventBus = getGlobalEventBus();

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<User[]>('/users');
      
      if (response.ok) {
        setUsers(response.data);
        eventBus.emit('users:loaded', { count: response.data.length });
      } else {
        setError(`Failed to fetch users: ${response.statusText}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await api.delete(`/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      eventBus.emit('user:deleted', { userId });
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const updateUserStatus = async (userId: string, status: 'active' | 'inactive') => {
    try {
      await api.patch(`/users/${userId}`, { status });
      setUsers(users.map(u => 
        u.id === userId ? { ...u, status } : u
      ));
      eventBus.emit('user:updated', { userId, status });
    } catch (err) {
      setError('Failed to update user');
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">User Management</h2>
      
      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border hover:bg-gray-50">
                <td className="border p-2">{user.name}</td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">
                  <span className={`px-2 py-1 rounded text-white text-sm ${
                    user.status === 'active' ? 'bg-green-600' : 'bg-gray-600'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="border p-2 space-x-2">
                  <button
                    onClick={() => updateUserStatus(
                      user.id, 
                      user.status === 'active' ? 'inactive' : 'active'
                    )}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    Toggle
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManagementMFE;
```

---

## Event Communication

### Real-World Example: Cross-MFE Communication

**MFE 1: User Login Component**

```typescript
import React from 'react';
import { getGlobalEventBus } from '@shared/mfe';

const LoginMFE: React.FC = () => {
  const eventBus = getGlobalEventBus();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleLogin = async () => {
    // Your login logic here
    
    // Emit event when user logs in
    eventBus.emit('user:login', {
      email,
      loginTime: new Date().toISOString(),
    });
  };

  return (
    <div>
      <input 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default LoginMFE;
```

**MFE 2: Profile Component (Listens to Login Events)**

```typescript
import React, { useEffect, useState } from 'react';
import { getGlobalEventBus } from '@shared/mfe';

interface UserProfile {
  email: string;
  loginTime: string;
  status: 'logged-in' | 'logged-out';
}

const ProfileMFE: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const eventBus = getGlobalEventBus();

  useEffect(() => {
    // Listen for login events from other MFEs
    const unsubscribe = eventBus.on('user:login', (payload) => {
      setProfile({
        email: payload.data.email,
        loginTime: payload.data.loginTime,
        status: 'logged-in',
      });
    });

    // Listen for logout events
    const unsubscribeLogout = eventBus.on('user:logout', () => {
      setProfile(null);
    });

    return () => {
      unsubscribe.unsubscribe();
      unsubscribeLogout.unsubscribe();
    };
  }, [eventBus]);

  if (!profile) return <div>Not logged in</div>;

  return (
    <div>
      <h2>Profile</h2>
      <p>Email: {profile.email}</p>
      <p>Status: {profile.status}</p>
      <p>Logged in at: {profile.loginTime}</p>
    </div>
  );
};

export default ProfileMFE;
```

---

## Registry System

### Querying the Registry from Your MFE

```typescript
import React, { useEffect, useState } from 'react';
import { getGlobalRegistry } from '@shared/mfe';

const MFEDiscoveryComponent: React.FC = () => {
  const [mfes, setMfes] = useState<any[]>([]);
  const [selectedTag, setSelectedTag] = useState('');
  const registry = getGlobalRegistry();

  useEffect(() => {
    if (selectedTag) {
      const filtered = registry.findByTag(selectedTag);
      setMfes(filtered);
    } else {
      setMfes(registry.getAll());
    }
  }, [selectedTag]);

  const tags = registry.getTags();

  return (
    <div className="space-y-4">
      <div>
        <h3>Filter by tag:</h3>
        <select 
          value={selectedTag} 
          onChange={(e) => setSelectedTag(e.target.value)}
        >
          <option value="">All MFEs</option>
          {tags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      <div>
        <h3>Available MFEs: {mfes.length}</h3>
        {mfes.map(mfe => (
          <div key={mfe.id} className="border p-4 rounded mb-2">
            <h4>{mfe.name}</h4>
            <p>{mfe.description}</p>
            <div className="flex gap-2 mt-2">
              {mfe.tags.map(tag => (
                <span key={tag} className="bg-blue-100 px-2 py-1 rounded text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MFEDiscoveryComponent;
```

---

## Advanced Patterns

### 1. Shared State Between MFEs

```typescript
// shared/state.ts
import { getGlobalEventBus } from './mfe';

class SharedState {
  private data: Record<string, any> = {};
  private eventBus = getGlobalEventBus();

  set(key: string, value: any) {
    this.data[key] = value;
    this.eventBus.emit(`state:${key}:changed`, { value });
  }

  get(key: string) {
    return this.data[key];
  }

  subscribe(key: string, callback: (value: any) => void) {
    return this.eventBus.on(`state:${key}:changed`, (payload) => {
      callback(payload.data.value);
    });
  }
}

export const sharedState = new SharedState();
```

**Usage in MFE 1:**

```typescript
import { sharedState } from '@shared/state';

const handleDataUpdate = () => {
  sharedState.set('user-preference', { theme: 'dark' });
};
```

**Usage in MFE 2:**

```typescript
import { sharedState } from '@shared/state';
import { useEffect, useState } from 'react';

const MyComponent = () => {
  const [preference, setPreference] = useState(null);

  useEffect(() => {
    const subscription = sharedState.subscribe('user-preference', setPreference);
    return () => subscription.unsubscribe();
  }, []);

  return <div>Theme: {preference?.theme}</div>;
};
```

### 2. Error Boundaries for MFEs

```typescript
import React from 'react';
import { getGlobalEventBus } from '@shared/mfe';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mfeId?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class MFEErrorBoundary extends React.Component<Props, State> {
  private eventBus = getGlobalEventBus();

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Emit error event
    this.eventBus.emit('mfe:error', {
      mfeId: this.props.mfeId,
      error: error.message,
      stack: error.stack,
    });

    // Log to console
    console.error(`MFE Error (${this.props.mfeId}):`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="border border-red-300 bg-red-50 p-4 rounded">
            <h3 className="text-red-700 font-bold">Something went wrong</h3>
            <p className="text-red-600">{this.state.error?.message}</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default MFEErrorBoundary;
```

**Usage:**

```typescript
import MFEErrorBoundary from '@/components/MFEErrorBoundary';
import MyMFE from './MyMFE';

<MFEErrorBoundary mfeId="my-mfe">
  <MyMFE />
</MFEErrorBoundary>
```

---

## Testing

### Unit Testing Your MFE

Create `client/components/mfe-samples/__tests__/MyAwesomeMFE.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getGlobalEventBus, resetEventBus } from '@shared/mfe';

describe('MyAwesomeMFE', () => {
  beforeEach(() => {
    // Reset event bus before each test
    resetEventBus();
  });

  afterEach(() => {
    // Cleanup after each test
    resetEventBus();
  });

  it('should emit load event on mount', (done) => {
    const eventBus = getGlobalEventBus();
    
    const unsubscribe = eventBus.once('mfe:myawesome:loaded', (payload) => {
      expect(payload.type).toBe('mfe:myawesome:loaded');
      expect(payload.data.timestamp).toBeDefined();
      unsubscribe.unsubscribe();
      done();
    });

    // Simulate component mount
    eventBus.emit('mfe:myawesome:loaded', {
      timestamp: new Date().toISOString(),
    });
  });

  it('should handle events correctly', () => {
    const eventBus = getGlobalEventBus();
    const listener = (payload: any) => {
      expect(payload.data.message).toBe('test');
    };

    const sub = eventBus.on('test:event', listener);
    eventBus.emit('test:event', { message: 'test' });
    sub.unsubscribe();
  });
});
```

### Integration Testing

```typescript
import { describe, it, expect } from 'vitest';
import { getGlobalRuntime, getGlobalRegistry } from '@shared/mfe';

describe('MFE Integration', () => {
  it('should register and load an MFE', async () => {
    const runtime = getGlobalRuntime();
    const registry = getGlobalRegistry();

    const mfe = registry.get('dashboard');
    expect(mfe).toBeDefined();

    if (mfe) {
      const container = await runtime.loadModule('dashboard', mfe.config);
      expect(container.loaded).toBe(true);
      
      await runtime.unloadModule('dashboard');
    }
  });
});
```

---

## Deployment

### Build for Production

```bash
# Build both client and server
pnpm build

# Output:
# ✓ dist/spa/index.html
# ✓ dist/spa/assets/index-*.css
# ✓ dist/spa/assets/index-*.js
# ✓ dist/server/node-build.mjs
```

### Environment Variables

Create `.env.production`:

```env
VITE_API_BASE_URL=https://api.example.com
NODE_ENV=production
PORT=3000
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy files
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm build

# Start server
EXPOSE 3000
CMD ["pnpm", "start"]
```

Build and run:

```bash
# Build Docker image
docker build -t mfe-framework .

# Run container
docker run -p 3000:3000 mfe-framework
```

### Netlify Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod

# Or connect GitHub repository for automatic deployments
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## Troubleshooting

### Issue 1: "Module not found" Error

**Problem:** Getting error "Cannot find module '@shared/mfe'"

**Solution:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install

# Clear Vite cache
rm -rf .vite

# Restart dev server
pnpm dev
```

### Issue 2: "Event Bus Not Initialized"

**Problem:** Event bus is undefined

**Solution:**

```typescript
// Always import from global instance
import { getGlobalEventBus } from '@shared/mfe';

// NOT this:
// import { EventBus } from '@shared/mfe';
// const eventBus = new EventBus(); // ❌ Wrong

const eventBus = getGlobalEventBus(); // ✅ Correct
```

### Issue 3: MFE Not Loading

**Problem:** MFE loads but doesn't display

**Solution:**

1. Check component is exported as default:
```typescript
export default MyMFE;  // ✅ Correct
export { MyMFE };      // ❌ Won't work with registry
```

2. Verify it's added to `componentMap`:
```typescript
const componentMap = {
  myawesome: MyAwesomeMFE, // Must be here
};
```

3. Check browser console for errors
4. Verify component renders valid JSX

### Issue 4: Build Fails with TypeScript Errors

**Solution:**

```bash
# Check for type errors
pnpm typecheck

# Fix issues shown, or ignore non-critical ones
# by adding // @ts-ignore comments

// Add explicit type
const data: MyType = fetchedData;
```

### Issue 5: Slow Bundle Size

**Solution:**

```typescript
// Use dynamic imports for large components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Suspend loading
<React.Suspense fallback={<div>Loading...</div>}>
  <HeavyComponent />
</React.Suspense>
```

---

## Tips & Tricks

### Tip 1: Debugging Event Bus

```typescript
import { getGlobalEventBus } from '@shared/mfe';

const eventBus = getGlobalEventBus();

// Check all events fired
const history = eventBus.getHistory();
console.log('All events:', history);

// Check specific event
const loginEvents = eventBus.getHistory('user:login');
console.log('Login events:', loginEvents);

// Count listeners
const count = eventBus.getListenerCount('user:login');
console.log('Listeners:', count);
```

### Tip 2: Fast Performance

```typescript
// ✅ Good: Lazy load MFEs
const Dashboard = React.lazy(() => import('./Dashboard'));

// ✅ Good: Use memo to prevent re-renders
const OptimizedMFE = React.memo(MyMFE);

// ✅ Good: Use useCallback for event handlers
const handleClick = useCallback(() => {
  eventBus.emit('action', { data });
}, []);

// ❌ Avoid: Creating new functions in render
// handleClick={() => eventBus.emit(...)} // Bad!
```

### Tip 3: Type Safety

```typescript
// Always type your API responses
interface UserResponse {
  id: string;
  name: string;
  email: string;
}

const response: ApiResponse<UserResponse> = await api.get('/user');
// Now response.data is typed as UserResponse

// Type your event payloads
interface LoginEvent {
  email: string;
  timestamp: string;
}

eventBus.on('user:login', (payload) => {
  const data: LoginEvent = payload.data; // Typed!
});
```

### Tip 4: Error Handling

```typescript
// Always wrap API calls in try-catch
try {
  const response = await api.get('/data');
  if (!response.ok) {
    console.error('API Error:', response.status);
  }
} catch (error) {
  console.error('Network Error:', error);
}

// Handle event listener errors
eventBus.on('action', (payload) => {
  try {
    // Your logic
  } catch (error) {
    console.error('Event handling failed:', error);
    eventBus.emit('error:occurred', { error });
  }
});
```

### Tip 5: Component Organization

```
Organize by feature, not by type:

✅ Good:
client/components/mfe-samples/
├── UserManagement/
│   ├── UserList.tsx
│   ├── UserDetail.tsx
│   ├── hooks/
│   ├── utils/
│   └── index.ts
├── Analytics/
│   ├── Charts.tsx
│   ├── Reports.tsx
│   └── index.ts

❌ Bad:
client/components/
├── mfe-samples/
├── hooks/
├── utils/
├── types/
└── (Hard to navigate)
```

---

## Complete Examples

### Example 1: Complete E-Commerce MFE

```typescript
import React, { useState, useEffect } from 'react';
import { getGlobalHttpApi, getGlobalEventBus } from '@shared/mfe';
import { ShoppingCart, Star, Truck } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  inStock: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

const EcommerceMFE: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const api = getGlobalHttpApi('/api');
  const eventBus = getGlobalEventBus();

  useEffect(() => {
    loadProducts();
    
    // Listen for cart updates from other MFEs
    const unsubscribe = eventBus.on('cart:item:added', (payload) => {
      console.log('Item added from another MFE:', payload.data);
    });

    return () => unsubscribe.unsubscribe();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.get<Product[]>('/products');
      if (response.ok) {
        setProducts(response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }

    // Emit event
    eventBus.emit('cart:item:added', { productId: product.id, name: product.name });
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
    eventBus.emit('cart:item:removed', { productId });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) return <div className="p-4">Loading products...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">E-Commerce Store</h1>
        <p>Browse and purchase products</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-gray-200 h-40"></div>
            <div className="p-4">
              <h3 className="font-bold text-lg">{product.name}</h3>
              <div className="flex items-center gap-2 my-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{product.rating}/5</span>
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-2">${product.price}</div>
              
              {!product.inStock && (
                <div className="text-red-600 mb-2">Out of Stock</div>
              )}

              <button
                onClick={() => addToCart(product)}
                disabled={!product.inStock}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Shopping Cart Sidebar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 right-0 w-80 bg-white border-l border-t rounded-tl-lg shadow-lg p-4 max-h-96 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="text-xl font-bold">Cart ({cart.length})</h2>
          </div>

          <div className="space-y-2 mb-4">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between mb-4">
              <span className="font-bold">Total:</span>
              <span className="text-xl font-bold">${cartTotal.toFixed(2)}</span>
            </div>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcommerceMFE;
```

### Example 2: Real-Time Notification MFE

```typescript
import React, { useEffect, useState } from 'react';
import { getGlobalEventBus } from '@shared/mfe';
import { Bell, X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

const NotificationMFE: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const eventBus = getGlobalEventBus();

  useEffect(() => {
    // Listen for notifications from other MFEs
    const unsubscribe = eventBus.onPattern(/notification:/, (payload) => {
      const notification: Notification = {
        id: `${Date.now()}`,
        title: payload.type.replace('notification:', '').toUpperCase(),
        message: payload.data.message,
        type: payload.data.type || 'info',
        timestamp: new Date().toISOString(),
      };

      setNotifications(prev => [notification, ...prev].slice(0, 10)); // Keep last 10

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    });

    return () => unsubscribe.unsubscribe();
  }, [eventBus]);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 space-y-3 z-50 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg flex items-start justify-between animate-slide-in ${
            notification.type === 'success' ? 'bg-green-50 border border-green-200' :
            notification.type === 'error' ? 'bg-red-50 border border-red-200' :
            notification.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
            'bg-blue-50 border border-blue-200'
          }`}
        >
          <div className="flex-1">
            <h3 className="font-semibold">{notification.title}</h3>
            <p className="text-sm">{notification.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-2 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationMFE;
```

---

## Quick Reference

### Command Cheatsheet

```bash
# Development
pnpm dev          # Start development server
pnpm typecheck    # Check TypeScript
pnpm test         # Run tests

# Building
pnpm build        # Build for production
pnpm build:client # Build only client
pnpm build:server # Build only server

# Formatting
pnpm format.fix   # Format code with Prettier
```

### Import Cheatsheet

```typescript
// Framework
import { initializeMFEFramework } from '@shared/mfe';
import { getGlobalRuntime } from '@shared/mfe';
import { getGlobalEventBus } from '@shared/mfe';
import { getGlobalRegistry } from '@shared/mfe';
import { getGlobalHttpApi } from '@shared/mfe';
import { getGlobalModuleLoader } from '@shared/mfe';

// Types
import type { MFEConfig, RegistryEntry, ApiResponse } from '@shared/mfe';

// Utils
import { cn } from '@/lib/utils';
```

---

## Support & Resources

- **Documentation:** See this guide
- **Examples:** Check `client/components/mfe-samples/`
- **Issues:** Report via GitHub Issues
- **Questions:** Create a Discussion

---

## Changelog

### v1.0.0 - Initial Release
- Core MFE Framework
- Module Loader
- Event Bus
- Registry System
- HTTP API Framework
- Sample MFEs
- Complete documentation

---

Happy building! 🚀 Follow this guide and you'll become an MFE expert in no time!
