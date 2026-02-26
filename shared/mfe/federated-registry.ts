/**
 * Federated Registry
 * Manages MFE discovery across multiple teams with namespace support
 */

import { MFERegistry, RegistryEntry, SAMPLE_REGISTRY_ENTRIES } from './registry';
import { getGlobalFederatedLoader, TeamManifest, RemoteModuleConfig } from './federated-loader';

export interface TeamInfo {
  teamId: string;
  teamName: string;
  teamUrl: string;
  manifestUrl: string;
  mfes: RegistryEntry[];
  lastUpdated: number;
  status: 'discovered' | 'loading' | 'ready' | 'error';
}

export interface TeamConfig {
  teamId: string;
  manifestUrl: string;
}

export interface FederatedRegistryConfig {
  localTeamId?: string;
  teams: TeamConfig[];
  autoDiscover?: boolean;
}

class FederatedRegistry extends MFERegistry {
  private teams: Map<string, TeamInfo> = new Map();
  private federatedLoader = getGlobalFederatedLoader();
  private discoveryPromise: Promise<void> | null = null;

  constructor() {
    super();
  }

  /**
   * Initialize federated registry with team configuration
   */
  async initialize(config: FederatedRegistryConfig): Promise<void> {
    console.log('[Federated Registry] Initializing with', config.teams.length, 'teams');

    // Register local team MFEs if provided
    if (config.localTeamId) {
      this._registerLocalTeam(config.localTeamId, SAMPLE_REGISTRY_ENTRIES);
    }

    // Discover remote teams
    if (config.autoDiscover !== false) {
      await this.discoverTeams(config.teams);
    }
  }

  /**
   * Discover and register teams
   */
  async discoverTeams(teamConfigs: TeamConfig[]): Promise<void> {
    // Prevent concurrent discovery
    if (this.discoveryPromise) {
      return this.discoveryPromise;
    }

    this.discoveryPromise = (async () => {
      const discoveryPromises = teamConfigs.map(config =>
        this._discoverTeam(config.teamId, config.manifestUrl).catch(err => {
          console.error(`[Federated Registry] Failed to discover team ${config.teamId}:`, err);
        })
      );

      await Promise.all(discoveryPromises);
      console.log(`[Federated Registry] Team discovery completed`);
    })();

    await this.discoveryPromise;
    this.discoveryPromise = null;
  }

  /**
   * Discover a single team
   */
  private async _discoverTeam(
    teamId: string,
    manifestUrl: string
  ): Promise<void> {
    try {
      // Mark team as loading
      this.teams.set(teamId, {
        teamId,
        teamName: teamId,
        teamUrl: manifestUrl.split('/api/')[0],
        manifestUrl,
        mfes: [],
        lastUpdated: Date.now(),
        status: 'loading',
      });

      // Load manifest from team's server
      const manifest = await this.federatedLoader.loadTeamManifest(
        teamId,
        manifestUrl
      );

      // Convert manifest MFEs to registry entries
      const entries: RegistryEntry[] = manifest.mfes.map(mfe => {
        const entry: RegistryEntry = {
          id: mfe.id, // team-{teamId}-{mfeId}
          name: mfe.name,
          description: mfe.description,
          version: mfe.version,
          icon: '🔷',
          tags: mfe.tags || [],
          scope: teamId, // Team as scope
          module: mfe.id,
          config: {
            id: mfe.id,
            scope: teamId,
            module: mfe.id,
            exposes: { default: mfe.remoteUrl },
          },
        };

        // Store federated-specific metadata in config as any
        (entry.config as any).teamId = teamId;
        (entry.config as any).mfeId = mfe.id;
        (entry.config as any).remoteUrl = mfe.remoteUrl;
        (entry.config as any).dependencies = mfe.dependencies;
        (entry.config as any).sharedDependencies = mfe.sharedDependencies;
        (entry.config as any).nested = mfe.nested;

        return entry;
      });

      // Update team info
      const teamInfo: TeamInfo = {
        teamId,
        teamName: manifest.teamName,
        teamUrl: manifest.teamUrl,
        manifestUrl,
        mfes: entries,
        lastUpdated: Date.now(),
        status: 'ready',
      };

      this.teams.set(teamId, teamInfo);

      // Register all MFEs from this team
      for (const entry of entries) {
        this.register(entry);
      }

      console.log(
        `[Federated Registry] Registered ${entries.length} MFEs from team: ${teamId}`
      );
    } catch (error) {
      // Mark team as error
      if (this.teams.has(teamId)) {
        const teamInfo = this.teams.get(teamId)!;
        teamInfo.status = 'error';
        teamInfo.lastUpdated = Date.now();
      }
      throw error;
    }
  }

  /**
   * Register local team MFEs
   */
  private _registerLocalTeam(
    teamId: string,
    entries: RegistryEntry[]
  ): void {
    const localEntries = entries.map(entry => {
      const newEntry: RegistryEntry = {
        ...entry,
        id: `${teamId}-${entry.id}`, // Namespace with team ID
        scope: teamId,
        config: entry.config,
      };
      // Add federated-specific metadata
      (newEntry.config as any).teamId = teamId;
      (newEntry.config as any).mfeId = entry.id;
      (newEntry.config as any).local = true;
      return newEntry;
    });

    const teamInfo: TeamInfo = {
      teamId,
      teamName: 'Local Team',
      teamUrl: location.origin,
      manifestUrl: '/api/mfe/manifest',
      mfes: localEntries,
      lastUpdated: Date.now(),
      status: 'ready',
    };

    this.teams.set(teamId, teamInfo);

    // Register entries
    for (const entry of localEntries) {
      this.register(entry);
    }

    console.log(`[Federated Registry] Registered ${localEntries.length} local MFEs`);
  }

  /**
   * Get all MFEs from a team
   */
  getTeamMFEs(teamId: string): RegistryEntry[] {
    const teamInfo = this.teams.get(teamId);
    return teamInfo ? teamInfo.mfes : [];
  }

  /**
   * Get team information
   */
  getTeamInfo(teamId: string): TeamInfo | undefined {
    return this.teams.get(teamId);
  }

  /**
   * Get all registered teams
   */
  getAllTeams(): TeamInfo[] {
    return Array.from(this.teams.values());
  }

  /**
   * Get teams by status
   */
  getTeamsByStatus(status: 'discovered' | 'loading' | 'ready' | 'error'): TeamInfo[] {
    return Array.from(this.teams.values()).filter(t => t.status === status);
  }

  /**
   * Search across all teams
   */
  searchAcrossTeams(query: string): RegistryEntry[] {
    const results: RegistryEntry[] = [];
    const lowerQuery = query.toLowerCase();

    for (const team of this.teams.values()) {
      for (const mfe of team.mfes) {
        if (
          mfe.name.toLowerCase().includes(lowerQuery) ||
          mfe.description?.toLowerCase().includes(lowerQuery) ||
          mfe.id.toLowerCase().includes(lowerQuery) ||
          mfe.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        ) {
          results.push(mfe);
        }
      }
    }

    return results;
  }

  /**
   * Get MFE by team and ID
   */
  getByTeamAndId(teamId: string, mfeId: string): RegistryEntry | undefined {
    const fullId = `${teamId}-${mfeId}`;
    return this.get(fullId);
  }

  /**
   * Get team ID from MFE ID
   */
  getTeamIdFromMfeId(mfeId: string): string | undefined {
    // Assuming format: team-{teamId}-{mfeId}
    const match = mfeId.match(/^team-(.+?)-/);
    return match ? match[1] : undefined;
  }

  /**
   * Get MFE config as remote module config
   */
  getMFERemoteConfig(mfeId: string): RemoteModuleConfig | undefined {
    const entry = this.get(mfeId);
    if (!entry) return undefined;

    const config = entry.config as any;
    if (!config.remoteUrl) return undefined;

    return {
      teamId: config.teamId,
      mfeId: config.mfeId || mfeId,
      remoteUrl: config.remoteUrl,
      version: config.version,
      dependencies: config.dependencies,
      sharedDependencies: config.sharedDependencies,
    };
  }

  /**
   * Refresh team manifest
   */
  async refreshTeam(teamId: string): Promise<void> {
    const teamInfo = this.teams.get(teamId);
    if (!teamInfo) {
      throw new Error(`Team not found: ${teamId}`);
    }

    console.log(`[Federated Registry] Refreshing team: ${teamId}`);

    // Clear cached manifest and MFEs
    this.federatedLoader.clearCache();

    // Re-discover team
    await this._discoverTeam(teamId, teamInfo.manifestUrl);
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalTeams: number;
    totalMFEs: number;
    teamStats: Record<string, { mfeCount: number; status: string }>;
  } {
    const teamStats: Record<string, { mfeCount: number; status: string }> = {};

    for (const [teamId, teamInfo] of this.teams.entries()) {
      teamStats[teamId] = {
        mfeCount: teamInfo.mfes.length,
        status: teamInfo.status,
      };
    }

    return {
      totalTeams: this.teams.size,
      totalMFEs: Array.from(this.teams.values()).reduce(
        (sum, team) => sum + team.mfes.length,
        0
      ),
      teamStats,
    };
  }

  /**
   * Export registry as JSON
   */
  exportRegistry(): {
    teams: TeamInfo[];
    mfes: RegistryEntry[];
  } {
    return {
      teams: Array.from(this.teams.values()),
      mfes: this.getAll(), // Use public getAll() method
    };
  }
}

let globalFederatedRegistry: FederatedRegistry | null = null;

export const getGlobalFederatedRegistry = (
  config?: FederatedRegistryConfig
): FederatedRegistry => {
  if (!globalFederatedRegistry) {
    globalFederatedRegistry = new FederatedRegistry();
    if (config) {
      globalFederatedRegistry.initialize(config);
    }
  }
  return globalFederatedRegistry;
};

export const resetFederatedRegistry = (): void => {
  globalFederatedRegistry = null;
};

export { FederatedRegistry };
