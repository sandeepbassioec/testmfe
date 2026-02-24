# Production Federated MFE Deployment Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Multi-Team Setup](#multi-team-setup)
3. [Deployment Process](#deployment-process)
4. [Configuration Management](#configuration-management)
5. [Dynamic Loading/Unloading](#dynamic-loadingunloading)
6. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
7. [Security Considerations](#security-considerations)
8. [Performance Optimization](#performance-optimization)
9. [Team Onboarding](#team-onboarding)

---

## Architecture Overview

### Multi-Team Federated Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                 Host Application (Orchestrator)              │
│                    localhost:8080                            │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Federated Registry                                    │  │
│  │ - Discovers teams from config                        │  │
│  │ - Loads manifests from remote servers               │  │
│  │ - Maintains MFE registry with namespace support     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                   │
│        ┌──────────────────┼──────────────────┐               │
│        │                  │                  │               │
│   ┌────────┐          ┌────────┐         ┌────────┐         │
│   │Team A  │          │Team B  │         │Team C  │         │
│   │Port    │          │Port    │         │Port    │         │
│   │5173    │          │5174    │         │5175    │         │
│   └────────┘          └────────┘         └────────┘         │
│        │                  │                  │               │
└────────┼──────────────────┼──────────────────┼───────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
    Team A Server      Team B Server      Team C Server
    /api/mfe/          /api/mfe/          /api/mfe/
    manifest           manifest           manifest
```

### Key Components

1. **Orchestrator (Host App)**
   - Runs on port 8080
   - Loads federated registry on startup
   - Routes requests to appropriate teams
   - Manages dynamic MFE loading/unloading

2. **Federated Loader**
   - Loads MFE modules from remote URLs
   - Manages import maps for dependencies
   - Implements retry logic with exponential backoff
   - Caches loaded modules

3. **Federated Registry**
   - Maintains list of all teams and their MFEs
   - Discovers teams from configuration
   - Provides search and filtering across teams
   - Tracks team health status

4. **Team Servers**
   - Each team runs independently (port 5173, 5174, 5175, etc.)
   - Publishes manifest at `/api/mfe/manifest`
   - Serves MFE bundles from `/mfe/` directory

---

## Multi-Team Setup

### Development Environment

#### 1. Start Orchestrator (Host App)
```bash
cd /root/app/code
pnpm install
pnpm dev  # Runs on localhost:8080
```

#### 2. Start Team A
```bash
# In separate terminal
cd teams/team-a
pnpm install
pnpm dev  # Runs on localhost:5173
```

#### 3. Start Team B
```bash
# In separate terminal
cd teams/team-b
pnpm install
pnpm dev  # Runs on localhost:5174
```

#### 4. Start Team C
```bash
# In separate terminal
cd teams/team-c
pnpm install
pnpm dev  # Runs on localhost:5175
```

### Team Directory Structure

Each team maintains its own repository:

```
team-a/
├── src/
│   ├── mfes/
│   │   ├── Dashboard.tsx          # Team A MFE 1
│   │   ├── Analytics.tsx          # Team A MFE 2
│   │   └── MasterData.tsx         # Team A MFE 3
│   ├── manifest.ts                # Manifest generator
│   ├── vite.config.ts
│   └── package.json
├── dist/
│   ├── dashboard.js
│   ├── analytics.js
│   ├── master-data.js
│   └── manifest.json              # Published manifest
└── .env.production
```

### Team Manifest Format

Each team publishes a manifest at their `/api/mfe/manifest` endpoint:

```json
{
  "version": "1.0.0",
  "teamId": "team-a",
  "teamName": "Team A - Core Platform",
  "teamUrl": "https://team-a.company.com",
  "publishedAt": "2024-02-24T10:00:00Z",
  "mfes": [
    {
      "id": "dashboard",
      "name": "Dashboard",
      "description": "Main dashboard",
      "remoteUrl": "https://team-a.company.com/mfe/dashboard.js",
      "version": "1.2.3",
      "tags": ["core", "analytics"],
      "dependencies": {
        "react": "^18.0.0"
      },
      "sharedDependencies": ["react"],
      "nested": true
    }
  ]
}
```

---

## Deployment Process

### Team Deployment Flow

#### Step 1: Team Builds MFE Bundle
```bash
cd team-a
pnpm build  # Generates dist/ directory
```

#### Step 2: Team Generates Manifest
```typescript
// src/manifest.ts
import fs from 'fs';
import path from 'path';

const manifest = {
  version: "1.0.0",
  teamId: "team-a",
  teamName: "Team A",
  // ... manifest content
};

// Write to dist/manifest.json
fs.writeFileSync(
  path.join(__dirname, '../dist/manifest.json'),
  JSON.stringify(manifest, null, 2)
);
```

#### Step 3: Team Uploads to CDN/Server
```bash
# Upload dist/ to team's server
aws s3 sync ./dist s3://team-a-mfe-bucket/ --acl public-read
```

#### Step 4: Host App Discovers Update
```typescript
// Host app loads manifest and discovers new version
const registry = getGlobalFederatedRegistry();
await registry.refreshTeam('team-a');
```

---

## Configuration Management

### Environment-Based Configuration

Create `.env.production` in root:

```env
# Orchestrator Settings
VITE_ORCHESTRATOR_URL=https://app.company.com
VITE_NODE_ENV=production

# Team Manifest URLs (Production)
VITE_TEAM_A_MANIFEST=https://team-a.company.com/api/mfe/manifest
VITE_TEAM_B_MANIFEST=https://team-b.company.com/api/mfe/manifest
VITE_TEAM_C_MANIFEST=https://team-c.company.com/api/mfe/manifest

# Security
VITE_ENABLE_SIGNATURE_VERIFICATION=true
VITE_ENABLE_CORS=true

# Caching
VITE_MANIFEST_CACHE_TTL=3600000
VITE_MODULE_CACHE_TTL=86400000

# Logging
VITE_LOG_LEVEL=info
VITE_REMOTE_LOGGING_URL=https://logs.company.com/api/logs
```

### Runtime Configuration Override

```typescript
import { getFederationConfig } from './federation.config';

const config = getFederationConfig();

// Override if needed
if (process.env.VITE_CUSTOM_TEAM_URL) {
  config.teams[0].manifestUrl = process.env.VITE_CUSTOM_TEAM_URL;
}
```

---

## Dynamic Loading/Unloading

### Loading MFEs at Runtime

```typescript
import { getGlobalFederatedRegistry } from '@shared/mfe/federated-registry';
import { getGlobalRuntime } from '@shared/mfe/runtime';

const registry = getGlobalFederatedRegistry();
const runtime = getGlobalRuntime();

// Load a specific MFE
async function loadTeamMFE(teamId: string, mfeId: string) {
  try {
    // Get MFE entry from registry
    const mfe = registry.getByTeamAndId(teamId, mfeId);
    if (!mfe) throw new Error('MFE not found');

    // Get remote configuration
    const remoteConfig = registry.getMFERemoteConfig(mfe.id);

    // Load into runtime
    await runtime.loadModule(mfe.id, remoteConfig);

    console.log(`Loaded ${mfe.id}`);
  } catch (error) {
    console.error('Failed to load MFE:', error);
  }
}
```

### Unloading MFEs

```typescript
async function unloadTeamMFE(teamId: string, mfeId: string) {
  try {
    const mfeId = `${teamId}-${mfeId}`;

    // Unload from runtime
    await runtime.unloadModule(mfeId);

    // Clear from cache
    const loader = getGlobalFederatedLoader();
    loader.unloadModule(teamId, mfeId);

    console.log(`Unloaded ${mfeId}`);
  } catch (error) {
    console.error('Failed to unload MFE:', error);
  }
}
```

### Nested MFE Loading

```typescript
import NestedMFEHost from '@/components/NestedMFEHost';

export function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Load reports MFE from Team B inside this container */}
      <NestedMFEHost
        teamId="team-b"
        mfeId="reports"
        onLoad={() => console.log('Reports loaded')}
        onError={(error) => console.error('Failed to load reports:', error)}
      />
    </div>
  );
}
```

---

## Monitoring & Troubleshooting

### Health Checks

```typescript
import { getGlobalFederatedRegistry } from '@shared/mfe/federated-registry';

async function healthCheck() {
  const registry = getGlobalFederatedRegistry();
  const teams = registry.getAllTeams();

  for (const team of teams) {
    try {
      const response = await fetch(team.teamUrl + '/health');
      if (!response.ok) {
        console.warn(`Team ${team.teamId} health check failed`);
      }
    } catch (error) {
      console.error(`Team ${team.teamId} unreachable:`, error);
    }
  }
}

// Run health checks periodically
setInterval(healthCheck, 60000); // Every minute
```

### Monitoring Dashboard

Access `/admin` to view:
- **Team Status**: Which teams are ready/loading/error
- **Loaded MFEs**: Current MFEs in memory
- **Sync Status**: Background data sync status
- **Performance Metrics**: Query execution times

### Common Issues & Solutions

#### Issue: Manifest Not Loading
```typescript
// Check network request
const loader = getGlobalFederatedLoader();
try {
  const manifest = await loader.loadTeamManifest(
    'team-a',
    'https://team-a.company.com/api/mfe/manifest'
  );
  console.log('Manifest loaded:', manifest);
} catch (error) {
  console.error('Failed to load manifest:', error);
  // Check CORS, firewall, manifest URL
}
```

#### Issue: Module Load Timeout
```typescript
// Increase timeout in federation.config.ts
teams: [
  {
    teamId: 'team-a',
    manifestUrl: '...',
    timeout: 30000, // Increase from 10000
    retries: 5,
  }
]
```

#### Issue: Dependency Resolution Failure
```typescript
// Register shared dependencies in Orchestrator
const loader = getGlobalFederatedLoader();

loader.registerSharedDependency(
  'react',
  '18.2.0',
  'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm'
);

loader.registerSharedDependency(
  'react-dom',
  '18.2.0',
  'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm'
);
```

---

## Security Considerations

### 1. Manifest Validation
```typescript
// Verify manifest signature
function validateManifestSignature(
  manifest: TeamManifest,
  signature: string
): boolean {
  const computed = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(JSON.stringify(manifest))
    .digest('hex');
  return computed === signature;
}
```

### 2. Module Integrity
```typescript
// Verify module before loading
async function loadVerifiedModule(url: string, expectedHash: string) {
  const response = await fetch(url);
  const content = await response.text();
  const hash = await sha256(content);
  
  if (hash !== expectedHash) {
    throw new Error('Module integrity check failed');
  }

  return import(url);
}
```

### 3. CSP Headers
```typescript
// Set Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://team-a.company.com https://team-b.company.com; " +
    "style-src 'self' 'unsafe-inline'"
  );
  next();
});
```

### 4. CORS Configuration
```typescript
// Whitelist team origins
const allowedOrigins = [
  'https://team-a.company.com',
  'https://team-b.company.com',
  'https://team-c.company.com',
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
```

---

## Performance Optimization

### 1. Manifest Caching
```typescript
const config: FederationConfig = {
  caching: {
    manifestCacheTTL: 3600000, // 1 hour
    moduleCacheTTL: 86400000,   // 24 hours
    enableBrowserCache: true,
    enableServiceWorker: true,
  }
};
```

### 2. Lazy Loading Teams
```typescript
// Load teams on-demand instead of all at once
async function initializeFederation(selectedTeams: string[]) {
  const registry = getGlobalFederatedRegistry();
  
  for (const teamId of selectedTeams) {
    // Load only required teams
    const config = federation.teams.find(t => t.teamId === teamId);
    if (config) {
      await registry.discoverTeams([config]);
    }
  }
}
```

### 3. Code Splitting
```typescript
// Each team's MFE is in separate bundle
// Vite automatically code-splits at team boundary
```

---

## Team Onboarding

### New Team Checklist

- [ ] Create team repository (team-x)
- [ ] Setup Vite + React configuration
- [ ] Create MFE components in `src/mfes/`
- [ ] Generate manifest in build process
- [ ] Deploy to team's server/CDN
- [ ] Add team to `federation.config.ts`
- [ ] Test manifest discovery from orchestrator
- [ ] Verify MFE loading in orchestrator
- [ ] Document MFE API for other teams
- [ ] Setup monitoring/alerting

### Team Development Guide

Each team should:

1. **Follow Module Export Convention**
```typescript
// src/mfes/Dashboard.tsx
export default Dashboard;  // Default export required

// In manifest
{
  "remoteUrl": "https://team-a.company.com/mfe/dashboard.js",
  // remoteUrl must export default component
}
```

2. **Declare Dependencies**
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "sharedDependencies": ["react", "react-dom"]
}
```

3. **Support Nested Loading**
```typescript
// If nested: true in manifest
export default function Dashboard(props) {
  const { parentRuntime, eventBus, teamId, mfeId } = props;
  
  // Can load child MFEs using eventBus
  eventBus.emit('mfe:load-nested', {
    teamId: 'team-b',
    mfeId: 'reports'
  });
}
```

---

## Production Checklist

- [ ] All manifests deployed and accessible
- [ ] CORS properly configured
- [ ] CSP headers set
- [ ] Signature verification enabled
- [ ] Rate limiting enabled
- [ ] Monitoring dashboard active
- [ ] Health checks running
- [ ] Logging configured
- [ ] Fallback URLs configured
- [ ] Load testing completed
- [ ] Security audit done
- [ ] Team documentation complete
