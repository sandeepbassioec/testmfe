# Federated Module Federation & Nested MFE Architecture

## Overview

This document describes the transformation of the MFE framework to support:
1. **Module Federation**: Multiple teams publishing MFEs independently to different servers
2. **Nested MFEs**: MFEs that can load and compose other MFEs
3. **Team-Based Organization**: Logical separation of MFEs by team/domain

---

## Architecture

### Current Structure (Single Team)
```
Host Application
├── MFE 1 (Dashboard)
├── MFE 2 (Analytics)
├── MFE 3 (Settings)
└── MFE 4 (Master Data)
```

### New Architecture (Multi-Team Federated)
```
Host Application (Orchestrator)
│
├── Team A (Published at team-a.company.com)
│   ├── MFE A1 (Dashboard)
│   ├── MFE A2 (Analytics)
│   └── Nested Container (Can host Team B MFEs)
│
├── Team B (Published at team-b.company.com)
│   ├── MFE B1 (Reports)
│   ├── MFE B2 (Settings)
│   └── Nested Container (Can host Team C MFEs)
│
└── Team C (Published at team-c.company.com)
    ├── MFE C1 (Billing)
    └── MFE C2 (Support)
```

---

## Key Concepts

### 1. **Module Federation**
- Each team publishes MFEs from their own server/CDN
- Host app loads MFE manifest from each team's endpoint
- Runtime resolution of dependencies across teams
- No central coordination needed (parallel publishing)

### 2. **Nested MFEs**
- An MFE can act as a container for other MFEs
- Example: Team A's Dashboard can embed Team B's Reports widget
- Hierarchical composition (MFE-in-MFE-in-MFE)
- Each level has its own event bus, state, and runtime

### 3. **Team Namespacing**
- Each team's MFEs have unique namespace: `team-{teamId}-{mfeId}`
- Registry entries include team information
- Routing reflects team structure: `/app/team-a/dashboard`, `/app/team-b/reports`
- Isolation of team-specific state and configuration

---

## Implementation Strategy

### Phase 1: Federated Module Loading
**Goal**: Support loading MFEs from multiple remote servers

```typescript
// Team A Server (team-a.company.com)
GET /mfe/manifest
→ {
    "version": "1.0.0",
    "mfes": [
      {
        "id": "team-a-dashboard",
        "name": "Dashboard",
        "remoteUrl": "https://team-a.company.com/mfe/dashboard.js",
        "version": "1.2.3",
        "dependencies": { "react": "^18.0.0" }
      }
    ]
  }

// Team B Server (team-b.company.com)
GET /mfe/manifest
→ {
    "version": "1.0.0",
    "mfes": [
      {
        "id": "team-b-reports",
        "name": "Reports",
        "remoteUrl": "https://team-b.company.com/mfe/reports.js",
        "version": "2.0.0",
        "dependencies": { "react": "^18.0.0" }
      }
    ]
  }
```

### Phase 2: Nested MFE Containers
**Goal**: Support MFEs loading other MFEs

```typescript
// Team A Dashboard (itself an MFE) can embed Team B Reports
<NestedMFEContainer
  mfeId="team-b-reports"
  teamId="team-b"
  config={{ ... }}
/>

// This creates a sandboxed runtime within the parent MFE's runtime
```

### Phase 3: Dynamic Registry
**Goal**: Maintain registry of all federated MFEs

```typescript
const registry = getGlobalRegistry();

// Discover all team MFEs
registry.discoverTeams(['team-a', 'team-b', 'team-c']);

// Get all MFEs from Team A
registry.getTeamMFEs('team-a');

// Get a specific MFE
registry.get('team-a-dashboard');

// Search across all teams
registry.searchAcrossTeams('dashboard');
```

---

## File Structure

### New Directory Layout
```
project/
├── host/                          # Host application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Orchestrator.tsx   # Main app orchestrator
│   │   │   └── TeamDashboard.tsx  # Team-specific pages
│   │   ├── components/
│   │   │   ├── NestedMFEHost.tsx  # Nested MFE container
│   │   │   └── FederatedRegistry/ # Federated discovery
│   │   └── federation/
│   │       ├── manifest-loader.ts # Load team manifests
│   │       ├── import-map.ts      # ES module import maps
│   │       └── shared-dependencies.ts
│   └── vite.config.ts
│
├── teams/                         # Team MFEs
│   ├── team-a/
│   │   ├── src/
│   │   │   ├── mfes/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   └── Analytics.tsx
│   │   │   ├── manifest.json     # Team A's manifest
│   │   │   └── vite.config.ts
│   │   └── package.json
│   │
│   ├── team-b/
│   │   ├── src/
│   │   │   ├── mfes/
│   │   │   │   ├── Reports.tsx
│   │   │   │   └── Settings.tsx
│   │   │   ├── manifest.json     # Team B's manifest
│   │   │   └── vite.config.ts
│   │   └── package.json
│   │
│   └── team-c/
│       ├── src/
│       │   ├── mfes/
│       │   │   ├── Billing.tsx
│       │   │   └── Support.tsx
│       │   ├── manifest.json
│       │   └── vite.config.ts
│       └── package.json
│
├── shared/                        # Shared utilities (used by all)
│   ├── mfe-framework.ts
│   ├── types.ts
│   ├── hooks.ts
│   └── utils.ts
│
└── manifests/                     # Federated manifest registry
    ├── team-a-manifest.json
    ├── team-b-manifest.json
    └── team-c-manifest.json
```

---

## API Contracts

### Team Manifest Format (v1.0)
```typescript
interface TeamManifest {
  version: string;
  teamId: string;
  teamName: string;
  teamUrl: string;
  mfes: Array<{
    id: string;                    // team-{teamId}-{mfeId}
    name: string;
    description: string;
    remoteUrl: string;             // Full URL to JS bundle
    tags: string[];
    dependencies: Record<string, string>;
    sharedDependencies?: string[]; // ["react", "react-dom"]
    requiredVersion?: string;
    nested?: boolean;              // Can host other MFEs
    routes?: Array<{
      path: string;
      component: string;
    }>;
    config?: Record<string, any>;
  }>;
  publishedAt: string;
  signature?: string;              // For security verification
}
```

### Manifest Endpoint
```
GET https://team-a.company.com/api/mfe/manifest
GET https://team-b.company.com/api/mfe/manifest
GET https://team-c.company.com/api/mfe/manifest

Host Application discovers teams from:
GET https://orchestrator.company.com/api/federation/teams
→ [
    { teamId: "team-a", manifestUrl: "https://team-a.company.com/api/mfe/manifest" },
    { teamId: "team-b", manifestUrl: "https://team-b.company.com/api/mfe/manifest" },
    { teamId: "team-c", manifestUrl: "https://team-c.company.com/api/mfe/manifest" }
  ]
```

---

## Implementation Details

### 1. Federated Module Loader
```typescript
// shared/federation/federated-loader.ts

interface RemoteModuleConfig {
  teamId: string;
  mfeId: string;
  remoteUrl: string;
  dependencies?: Record<string, string>;
}

class FederatedModuleLoader {
  private loadedModules: Map<string, any> = new Map();
  private importMap: Record<string, string> = {};
  
  // Load a remote team manifest
  async loadTeamManifest(teamId: string, manifestUrl: string): Promise<TeamManifest> {
    // Fetch, validate, cache manifest
  }
  
  // Load MFE from remote URL with dependencies
  async loadRemoteModule(config: RemoteModuleConfig): Promise<any> {
    // Setup import map for dependencies
    // Dynamically inject script tag
    // Return module
  }
  
  // Build import map for shared dependencies
  private buildImportMap(dependencies: Record<string, string>): void {
    // Map all team dependencies to CDN URLs or local paths
  }
  
  // Validate module signature
  private validateModuleSignature(module: any, signature: string): boolean {
    // Use HMAC to verify module integrity
  }
}
```

### 2. Nested MFE Container
```typescript
// client/components/NestedMFEContainer.tsx

interface NestedMFEContainerProps {
  teamId: string;
  mfeId: string;
  parentRuntime: MFERuntime;
  config?: Record<string, any>;
  eventPrefix?: string;
}

export function NestedMFEContainer(props: NestedMFEContainerProps) {
  // Creates isolated runtime within parent
  // Has own event bus (but can bubble up to parent)
  // Own state management context
  // Proper cleanup on unmount
  
  return (
    <MFEContext.Provider value={childRuntime}>
      <div id={`nested-${teamId}-${mfeId}`}>
        {/* Child MFE renders here */}
      </div>
    </MFEContext.Provider>
  );
}
```

### 3. Updated Registry
```typescript
// shared/mfe/federated-registry.ts

class FederatedRegistry extends MFERegistry {
  private teams: Map<string, TeamInfo> = new Map();
  private remoteManifests: Map<string, TeamManifest> = new Map();
  
  // Discover and register teams
  async discoverTeams(teamConfigs: TeamConfig[]): Promise<void> {
    for (const config of teamConfigs) {
      const manifest = await this.loadTeamManifest(config.teamId, config.manifestUrl);
      this.registerTeam(config.teamId, manifest);
    }
  }
  
  // Get all MFEs for a team
  getTeamMFEs(teamId: string): RegistryEntry[] {
    // Return MFEs belonging to a team
  }
  
  // Search across all teams
  searchAcrossTeams(query: string): RegistryEntry[] {
    // Full-text search across all teams' MFEs
  }
  
  // Get MFE with full path
  getByTeamAndId(teamId: string, mfeId: string): RegistryEntry {
    // team-a-dashboard → fetch from Team A manifest
  }
}
```

### 4. Team-Based Routing
```typescript
// client/App.tsx

<BrowserRouter>
  <Routes>
    {/* Host orchestrator */}
    <Route path="/orchestrator" element={<Orchestrator />} />
    
    {/* Team routes */}
    <Route path="/app/:teamId/*" element={<TeamDashboard />} />
    
    {/* Team-specific MFE routes */}
    <Route path="/app/:teamId/:mfeId/*" element={<DynamicMFEPage />} />
    
    {/* Nested MFE routes */}
    <Route path="/app/:teamId/:mfeId/:nestedTeamId/:nestedMfeId" element={<NestedMFEPage />} />
    
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

---

## Multi-Team Deployment Model

### Team A Organization (team-a.company.com)
```
Infrastructure:
├── Vite Dev Server (localhost:5173)
├── Build Output: /dist
├── CDN: https://team-a.company.com/mfe/
└── Manifest Endpoint: https://team-a.company.com/api/mfe/manifest

Deployment:
1. Team A runs: pnpm build
2. Generates:
   - dashboard.js, dashboard.css
   - analytics.js, analytics.css
3. Uploads to: https://team-a.company.com/mfe/
4. Updates manifest at: https://team-a.company.com/api/mfe/manifest
5. Host app discovers via orchestrator
```

### Team B Organization (team-b.company.com)
```
Independent deployment cycle:
- Team B can deploy without notifying Host or Team A
- Host app automatically discovers new versions
- Shared dependencies managed via import maps
```

### Independent Scaling
```
Team A scales independently:
- Traffic spike → Team A scales their infrastructure
- Host app keeps working
- Other teams unaffected

Team B scales independently:
- Same story
- No cross-team impact
```

---

## Benefits of This Architecture

### 1. **True Parallel Development**
- Team A can work on Dashboard without waiting for Team B
- Independent git repos, CI/CD pipelines
- Different tech stacks possible (React, Vue, etc.)

### 2. **Independent Deployment**
- Team A deploys dashboard v2 → automatically available
- Team B still on reports v1 → no breaking changes
- Host app is the orchestrator only

### 3. **Scalability**
- Each team scales their own infrastructure
- No central bottleneck
- Teams can be in different regions

### 4. **Modularity**
- MFEs are truly independent modules
- Can be used in multiple applications
- Easy to test in isolation

### 5. **Ownership & Responsibility**
- Team A owns their MFEs
- Team B owns their MFEs
- Clear accountability

---

## Comparison: Current vs. New

| Aspect | Current | New (Federated) |
|--------|---------|-----------------|
| **Deployment** | Single host app | Multiple independent servers |
| **Publishing** | Central monorepo | Team-specific repos |
| **Nesting** | Flat structure | Hierarchical |
| **Scaling** | Host app scales | Each team scales |
| **Coordination** | Required | Not required |
| **Version Control** | Monorepo | Polyrepo |
| **Teams** | Single team | Multiple teams |
| **Composability** | Limited | Rich |

---

## Next Steps

1. **Create Federated Module Loader** - Load MFEs from remote URLs
2. **Update Registry** - Support team namespacing and remote discovery
3. **Implement Nested Containers** - MFE-in-MFE support
4. **Create Team Structure** - sample-team-a, sample-team-b
5. **Update Routing** - Support /app/team-id/mfe-id paths
6. **Documentation** - Team onboarding guide

---

## Migration Path

### Week 1: Foundation
- Implement federated loader
- Update registry for team support
- Create sample team manifests

### Week 2: Integration
- Implement nested containers
- Update routing
- Create team deployment docs

### Week 3: Testing & Refinement
- Test multi-team scenarios
- Performance optimization
- Security hardening

### Week 4: Documentation & Training
- Developer guide for new teams
- Deployment playbooks
- Troubleshooting guides
