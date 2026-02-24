/**
 * Federated Module Loader
 * Dynamically loads MFEs from multiple remote servers (team-based repositories)
 * Supports import maps, dependency resolution, and module caching
 */

export interface SharedDependency {
  name: string;
  version: string;
  url: string; // CDN URL or local path
}

export interface RemoteModuleConfig {
  teamId: string;
  mfeId: string;
  remoteUrl: string;
  version?: string;
  dependencies?: Record<string, string>;
  sharedDependencies?: string[];
  timeout?: number;
  retries?: number;
}

export interface TeamManifest {
  version: string;
  teamId: string;
  teamName: string;
  teamUrl: string;
  publishedAt: string;
  mfes: Array<{
    id: string;
    name: string;
    description: string;
    remoteUrl: string;
    version: string;
    tags: string[];
    dependencies?: Record<string, string>;
    sharedDependencies?: string[];
    requiredVersion?: string;
    nested?: boolean;
    config?: Record<string, any>;
  }>;
  signature?: string;
}

export interface ImportMapConfig {
  imports: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
}

class FederatedModuleLoader {
  private loadedModules: Map<string, any> = new Map();
  private importMapCache: Map<string, ImportMapConfig> = new Map();
  private teamManifests: Map<string, TeamManifest> = new Map();
  private importMapScript: HTMLScriptElement | null = null;
  private sharedDependencies: Map<string, SharedDependency> = new Map();
  private defaultTimeout = 30000;
  private defaultRetries = 3;
  private loadingPromises: Map<string, Promise<any>> = new Map();

  constructor() {
    this._setupImportMapSupport();
  }

  /**
   * Load team manifest from remote server
   */
  async loadTeamManifest(
    teamId: string,
    manifestUrl: string,
    timeout = this.defaultTimeout
  ): Promise<TeamManifest> {
    // Return cached manifest if available
    if (this.teamManifests.has(teamId)) {
      return this.teamManifests.get(teamId)!;
    }

    try {
      console.log(`[Federated Loader] Loading manifest for team: ${teamId}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(manifestUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'X-Team-ID': teamId,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const manifest: TeamManifest = await response.json();

        // Validate manifest structure
        this._validateManifest(manifest);

        // Cache manifest
        this.teamManifests.set(teamId, manifest);

        console.log(`[Federated Loader] Manifest loaded for team: ${teamId}`);
        return manifest;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error(`[Federated Loader] Failed to load manifest for team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Load remote MFE module
   */
  async loadRemoteModule(
    config: RemoteModuleConfig
  ): Promise<any> {
    const moduleKey = `${config.teamId}-${config.mfeId}`;

    // Return cached module if available
    if (this.loadedModules.has(moduleKey)) {
      console.log(`[Federated Loader] Module found in cache: ${moduleKey}`);
      return this.loadedModules.get(moduleKey);
    }

    // Return pending promise if already loading
    if (this.loadingPromises.has(moduleKey)) {
      return this.loadingPromises.get(moduleKey);
    }

    // Create loading promise
    const loadingPromise = this._performModuleLoad(config);
    this.loadingPromises.set(moduleKey, loadingPromise);

    try {
      const module = await loadingPromise;
      this.loadedModules.set(moduleKey, module);
      return module;
    } finally {
      this.loadingPromises.delete(moduleKey);
    }
  }

  /**
   * Perform actual module loading with retry logic
   */
  private async _performModuleLoad(
    config: RemoteModuleConfig,
    attempt = 1
  ): Promise<any> {
    const timeout = config.timeout || this.defaultTimeout;
    const retries = config.retries || this.defaultRetries;

    try {
      console.log(
        `[Federated Loader] Loading module: ${config.teamId}-${config.mfeId} ` +
        `(attempt ${attempt}/${retries})`
      );

      // Setup import map for dependencies
      if (config.dependencies) {
        this._setupImportMap(config.dependencies);
      }

      // Load module via dynamic import
      const module = await this._loadModuleScript(config.remoteUrl, timeout);

      console.log(
        `[Federated Loader] Module loaded successfully: ${config.teamId}-${config.mfeId}`
      );

      return module;
    } catch (error) {
      if (attempt < retries) {
        const delay = Math.min(100 * Math.pow(2, attempt - 1), 5000);
        console.log(
          `[Federated Loader] Retrying in ${delay}ms... (attempt ${attempt + 1})`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._performModuleLoad(config, attempt + 1);
      }

      console.error(
        `[Federated Loader] Failed to load module after ${retries} attempts:`,
        error
      );
      throw error;
    }
  }

  /**
   * Load module script and return module
   */
  private async _loadModuleScript(
    url: string,
    timeout: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        // Create script element
        const script = document.createElement('script');
        script.type = 'module';
        script.src = url;
        script.async = true;

        // Success handler
        script.onload = () => {
          clearTimeout(timeoutId);
          // For module scripts, we need to access the module via global namespace
          const moduleName = url.split('/').pop()?.replace(/\.js$/, '') || 'module';
          const module = (window as any)[moduleName] || {};
          document.body.removeChild(script);
          resolve(module);
        };

        // Error handler
        script.onerror = () => {
          clearTimeout(timeoutId);
          document.body.removeChild(script);
          reject(new Error(`Failed to load script: ${url}`));
        };

        // Append to DOM
        document.body.appendChild(script);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Setup import map for dependency resolution
   */
  private _setupImportMap(dependencies: Record<string, string>): void {
    const importMap: ImportMapConfig = {
      imports: {},
    };

    for (const [pkg, version] of Object.entries(dependencies)) {
      // Map to shared dependency or CDN
      if (this.sharedDependencies.has(pkg)) {
        const dep = this.sharedDependencies.get(pkg)!;
        importMap.imports[pkg] = dep.url;
      } else {
        // Use unpkg or similar CDN
        importMap.imports[pkg] = `https://cdn.jsdelivr.net/npm/${pkg}@${version}/+esm`;
      }
    }

    // Update import map in DOM
    this._injectImportMap(importMap);
  }

  /**
   * Inject import map into document head
   */
  private _injectImportMap(config: ImportMapConfig): void {
    // Remove old import map
    if (this.importMapScript) {
      this.importMapScript.remove();
    }

    // Create new import map
    const importMapScript = document.createElement('script');
    importMapScript.type = 'importmap';
    importMapScript.textContent = JSON.stringify(config);

    document.head.prepend(importMapScript);
    this.importMapScript = importMapScript;
  }

  /**
   * Register shared dependency
   */
  registerSharedDependency(
    name: string,
    version: string,
    url: string
  ): void {
    this.sharedDependencies.set(name, { name, version, url });
    console.log(`[Federated Loader] Registered shared dependency: ${name}@${version}`);
  }

  /**
   * Setup import map support
   */
  private _setupImportMapSupport(): void {
    // Check if import maps are supported
    if (!this._supportsImportMaps()) {
      console.warn('[Federated Loader] Import maps not supported in this browser');
    }
  }

  /**
   * Check if browser supports import maps
   */
  private _supportsImportMaps(): boolean {
    try {
      const script = document.createElement('script');
      return 'supports' in script && (script as any).supports?.('importmap');
    } catch {
      return false;
    }
  }

  /**
   * Validate manifest structure
   */
  private _validateManifest(manifest: TeamManifest): void {
    if (!manifest.teamId || !manifest.mfes) {
      throw new Error('Invalid manifest: missing teamId or mfes');
    }

    for (const mfe of manifest.mfes) {
      if (!mfe.id || !mfe.remoteUrl) {
        throw new Error(`Invalid MFE in manifest: missing id or remoteUrl`);
      }
    }
  }

  /**
   * Unload module from cache
   */
  unloadModule(teamId: string, mfeId: string): void {
    const moduleKey = `${teamId}-${mfeId}`;
    this.loadedModules.delete(moduleKey);
    console.log(`[Federated Loader] Module unloaded: ${moduleKey}`);
  }

  /**
   * Get cached module
   */
  getModule(teamId: string, mfeId: string): any | undefined {
    return this.loadedModules.get(`${teamId}-${mfeId}`);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.loadedModules.clear();
    this.teamManifests.clear();
    this.loadingPromises.clear();
    console.log('[Federated Loader] All caches cleared');
  }

  /**
   * Get loaded modules count
   */
  getLoadedCount(): number {
    return this.loadedModules.size;
  }

  /**
   * Get all loaded team manifests
   */
  getLoadedTeams(): string[] {
    return Array.from(this.teamManifests.keys());
  }

  /**
   * Get manifest for team
   */
  getTeamManifest(teamId: string): TeamManifest | undefined {
    return this.teamManifests.get(teamId);
  }
}

let globalFederatedLoader: FederatedModuleLoader | null = null;

export const getGlobalFederatedLoader = (): FederatedModuleLoader => {
  if (!globalFederatedLoader) {
    globalFederatedLoader = new FederatedModuleLoader();
  }
  return globalFederatedLoader;
};

export { FederatedModuleLoader };
