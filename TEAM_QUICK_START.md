# Team Quick Start Guide

## Overview

This guide shows how to:
1. Understand the federated MFE architecture
2. Start the orchestrator (host application)
3. Run your team's MFE server independently
4. Test dynamic MFE loading/unloading
5. Deploy to production

---

## Architecture Quick View

```
┌─────────────────────────────────┐
│   Orchestrator (Host App)       │  localhost:8080
│   - Loads team manifests        │
│   - Manages MFE lifecycle       │
│   - Provides admin dashboard    │
└─────────────┬───────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼──┐ ┌───▼──┐ ┌───▼──┐
│Team A│ │Team B│ │Team C│
│:5173 │ │:5174 │ │:5175 │
└──────┘ └──────┘ └──────┘
```

Each team runs independently and publishes its MFEs via a manifest.

---

## Getting Started (5 Minutes)

### 1. Start Orchestrator
```bash
# Terminal 1
cd /root/app/code
pnpm install
pnpm dev

# Opens at http://localhost:8080
```

### 2. Start Your Team Server
```bash
# Terminal 2
# For Team A
cd teams/team-a
pnpm install
pnpm dev
# Or Team B: cd teams/team-b && pnpm dev
# Or Team C: cd teams/team-c && pnpm dev
```

### 3. Open in Browser
```
http://localhost:8080          # Main app
http://localhost:8080/app/team-a    # Team A MFEs
http://localhost:8080/app/team-b    # Team B MFEs
http://localhost:8080/app/team-c    # Team C MFEs
http://localhost:8080/admin         # Admin dashboard
```

### 4. Test Loading an MFE
1. Navigate to `http://localhost:8080/app/team-a`
2. See list of Team A's MFEs on the left
3. Click "Dashboard" to load it
4. MFE loads in the right panel

### 5. Test Unloading
In browser console:
```javascript
// Get the registry
const registry = await (async () => {
  const module = await import('@shared/mfe/federated-registry');
  return module.getGlobalFederatedRegistry();
})();

// Check loaded teams
console.log(registry.getAllTeams());

// See all MFEs
console.log(registry.getAll());
```

---

## Team Development Guide

### Team Structure

Each team is independent with its own:
- Repository
- Development server
- Build process
- Manifest file

```
team-a/
├── src/
│   ├── mfes/
│   │   ├── Dashboard.tsx
│   │   ├── Analytics.tsx
│   │   └── MasterData.tsx
│   ├── vite.config.ts
│   └── package.json
├── public/
│   └── manifests/
│       └── team-a-manifest.json
└── dist/
    ├── dashboard.js
    ├── analytics.js
    └── master-data.js
```

### Creating a New MFE in Your Team

1. **Create component** (`src/mfes/MyMFE.tsx`):
```typescript
import React from 'react';

export default function MyMFE() {
  return (
    <div>
      <h1>My Team MFE</h1>
      <p>Loaded from federated team!</p>
    </div>
  );
}
```

2. **Update manifest** (`public/manifests/team-x-manifest.json`):
```json
{
  "version": "1.0.0",
  "teamId": "team-x",
  "teamName": "Team X",
  "teamUrl": "http://localhost:5176",
  "mfes": [
    {
      "id": "my-mfe",
      "name": "My New MFE",
      "description": "My new MFE",
      "remoteUrl": "http://localhost:5176/mfe/my-mfe.js",
      "version": "1.0.0",
      "tags": ["new", "example"],
      "dependencies": {"react": "^18.0.0"},
      "sharedDependencies": ["react"],
      "nested": false
    }
  ]
}
```

3. **Build and serve**:
```bash
pnpm build
# MFE builds to dist/my-mfe.js
# Manifest at dist/manifests/team-x-manifest.json
```

### MFE Export Convention

Your MFE must export a default React component:

```typescript
// ✅ CORRECT
export default function MyMFE(props) {
  return <div>My MFE</div>;
}

// ❌ WRONG
export function MyMFE() { ... }
export default { MyMFE };
```

### Using Shared Dependencies

Request shared dependencies in manifest:
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "sharedDependencies": ["react", "react-dom"]
}
```

The orchestrator will inject these via import maps.

---

## Dynamic Loading/Unloading (Advanced)

### Load MFE Programmatically

```typescript
import { getGlobalFederatedRegistry } from '@shared/mfe';
import { getGlobalRuntime } from '@shared/mfe';

async function loadMFE() {
  const registry = getGlobalFederatedRegistry();
  const runtime = getGlobalRuntime();

  // Get MFE from registry
  const mfe = registry.getByTeamAndId('team-a', 'dashboard');
  
  // Get remote configuration
  const config = registry.getMFERemoteConfig(mfe.id);

  // Load into runtime
  await runtime.loadModule(mfe.id, config);

  console.log('MFE loaded!');
}

loadMFE().catch(console.error);
```

### Unload MFE

```typescript
import { getGlobalRuntime } from '@shared/mfe';
import { getGlobalFederatedLoader } from '@shared/mfe';

async function unloadMFE() {
  const runtime = getGlobalRuntime();
  const loader = getGlobalFederatedLoader();

  // Unload from runtime
  await runtime.unloadModule('team-a-dashboard');

  // Clear from cache
  loader.unloadModule('team-a', 'dashboard');

  console.log('MFE unloaded!');
}

unloadMFE().catch(console.error);
```

### Using NestedMFEHost Component

Load nested MFEs inside other components:

```typescript
import NestedMFEHost from '@/components/NestedMFEHost';

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Load Team B's Reports inside this container */}
      <NestedMFEHost
        teamId="team-b"
        mfeId="reports"
        onLoad={() => console.log('Reports loaded')}
        onError={(err) => console.error('Failed:', err)}
      />
    </div>
  );
}
```

---

## Admin Dashboard

Access `http://localhost:8080/admin` to:

- **Overview Tab**: View all teams and their status
- **Tables Tab**: Browse and manage master data
- **Queries Tab**: Execute advanced queries
- **Settings Tab**: View system configuration

Features:
- See which teams are ready/loading/error
- View all loaded MFEs
- Sync master data
- Clear caches
- Download data

---

## Production Deployment

### 1. Build Your MFEs
```bash
cd teams/team-a
pnpm build

# Generates dist/ with:
# - MFE bundles (dashboard.js, analytics.js, etc.)
# - Manifest (manifest.json)
# - CSS files
```

### 2. Upload to CDN/Server
```bash
# Upload to your team's server
aws s3 sync ./dist s3://team-a-bucket/ --acl public-read

# Or use SCP:
# scp -r dist/* user@team-a.company.com:/var/www/mfe/
```

### 3. Update Orchestrator Configuration
In production (`federation.config.ts`):
```typescript
{
  teamId: 'team-a',
  manifestUrl: 'https://team-a.company.com/api/mfe/manifest',
  // Instead of localhost
}
```

### 4. Redeploy Orchestrator
```bash
cd /root/app/code
pnpm build
# Deploy dist/ to production
```

### 5. Verify
```bash
# Check team discovery
https://app.company.com/admin
# See Team A in the admin dashboard
```

---

## Common Tasks

### Refresh Team Manifest
```typescript
const registry = getGlobalFederatedRegistry();
await registry.refreshTeam('team-a');
```

### Search All MFEs
```typescript
const registry = getGlobalFederatedRegistry();
const results = registry.searchAcrossTeams('dashboard');
console.log(results);
```

### Get Team Status
```typescript
const registry = getGlobalFederatedRegistry();
const stats = registry.getStats();
console.log(stats);
// {
//   totalTeams: 3,
//   totalMFEs: 8,
//   teamStats: { ... }
// }
```

### Export Registry
```typescript
const registry = getGlobalFederatedRegistry();
const data = registry.export();
console.log(JSON.stringify(data, null, 2));
```

---

## Troubleshooting

### Manifest Not Loading
```javascript
// Check in console
const registry = getGlobalFederatedRegistry();
const teams = registry.getAllTeams();
console.log(teams); // Should show teams with status: 'ready'

// If status is 'error':
// 1. Check manifest URL is correct
// 2. Verify CORS headers
// 3. Check team server is running
```

### MFE Load Timeout
```javascript
// In federation.config.ts, increase timeout:
{
  teamId: 'team-a',
  timeout: 30000  // Increase from 10000
}
```

### Dependency Not Found
```javascript
// Register in orchestrator before loading MFEs
const loader = getGlobalFederatedLoader();
loader.registerSharedDependency(
  'react',
  '18.2.0',
  'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm'
);
```

---

## Testing

### Test Manifest Discovery
```bash
# From orchestrator
curl http://localhost:5173/manifests/team-a-manifest.json
```

### Test MFE Bundle
```bash
# Should return JavaScript
curl http://localhost:5173/mfe/dashboard.js | head -20
```

### Test Loading in Browser
```javascript
// Open DevTools console
const loader = window.__federatedLoader;
const manifest = await loader.loadTeamManifest(
  'team-a',
  'http://localhost:5173/manifests/team-a-manifest.json'
);
console.log(manifest);
```

---

## Key Concepts

### Manifest
- JSON file published by each team
- Lists all team's MFEs and their URLs
- Includes dependency declarations
- Located at `/api/mfe/manifest` on team server

### Remote URL
- Direct URL to the MFE JavaScript bundle
- Example: `https://team-a.company.com/mfe/dashboard.js`
- Must be publicly accessible

### Team ID
- Unique identifier for team: `team-a`, `team-b`, etc.
- Used for namespacing: `team-a-dashboard`
- Part of URL: `/app/team-a`

### Nested MFEs
- MFEs that can host other MFEs
- Use `NestedMFEHost` component
- Enable composition of MFEs

---

## Support Resources

### Documentation
- **FEDERATED_ARCHITECTURE.md** - Detailed architecture
- **FEDERATED_DEPLOYMENT_GUIDE.md** - Production deployment
- **PRODUCTION_READY_CHECKLIST.md** - Implementation status

### Code References
- **shared/mfe/federated-loader.ts** - Module loading
- **shared/mfe/federated-registry.ts** - Team discovery
- **client/components/NestedMFEHost.tsx** - Component loading
- **client/pages/TeamDashboard.tsx** - Team routing

### Examples
- **public/manifests/team-*.json** - Sample manifests
- **federation.config.ts** - Configuration examples

---

## Next Steps

1. **Explore**: Navigate through orchestrator at localhost:8080
2. **Experiment**: Test loading/unloading MFEs
3. **Develop**: Add new MFEs to your team
4. **Deploy**: Push to production

Happy developing! 🚀
