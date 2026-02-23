/**
 * MFE Runtime
 * Manages MFE lifecycle, loading, and execution
 */

import { getGlobalEventBus } from './event-bus';
import { getGlobalModuleLoader } from './module-loader';
import type { MFEConfig, MFEContainer } from './types';

interface RuntimeConfig {
  debug?: boolean;
  preloadModules?: boolean;
  autoCleanup?: boolean;
}

class MFERuntime {
  private containers: Map<string, MFEContainer> = new Map();
  private config: Required<RuntimeConfig>;
  private eventBus = getGlobalEventBus();
  private moduleLoader = getGlobalModuleLoader();
  private mountPoints: Map<string, HTMLElement> = new Map();

  constructor(config: RuntimeConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      preloadModules: config.preloadModules ?? true,
      autoCleanup: config.autoCleanup ?? true,
    };

    this._setupCleanup();
    this._log('MFE Runtime initialized');
  }

  /**
   * Register a container for an MFE
   */
  registerContainer(id: string, config: MFEConfig): MFEContainer {
    if (this.containers.has(id)) {
      throw new Error(`Container ${id} already registered`);
    }

    const container: MFEContainer = {
      id,
      name: config.id,
      loaded: false,
    };

    this.containers.set(id, container);
    this.eventBus.emit('mfe:container:registered', { id, config });
    this._log(`Container registered: ${id}`);

    if (this.config.preloadModules && config.remoteEntry) {
      this.moduleLoader.preload(config.remoteEntry, config.scope).catch(err => {
        this._log(`Failed to preload ${id}: ${err.message}`, 'warn');
      });
    }

    return container;
  }

  /**
   * Load an MFE module
   */
  async loadModule(id: string, config: MFEConfig): Promise<MFEContainer> {
    const container = this.containers.get(id) || this.registerContainer(id, config);

    if (container.loaded) {
      return container;
    }

    try {
      this.eventBus.emit('mfe:loading:start', { id, config });
      this._log(`Loading module: ${id}`);

      // If remoteEntry is provided, load as remote module
      if (config.remoteEntry) {
        await this.moduleLoader.load(
          config.remoteEntry,
          config.scope,
          { timeout: 30000, retry: 3 }
        );
      }

      container.loaded = true;
      container.manifest = {
        name: config.id,
        version: '1.0.0',
        scope: config.scope,
        module: config.module,
        exposes: config.exposes,
        remoteEntry: config.remoteEntry,
      };

      this.eventBus.emit('mfe:loading:complete', { id, container });
      this._log(`Module loaded: ${id}`);

      return container;
    } catch (error) {
      container.loaded = false;
      this.eventBus.emit('mfe:loading:error', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      this._log(`Failed to load module ${id}: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Unload an MFE module
   */
  async unloadModule(id: string): Promise<void> {
    const container = this.containers.get(id);
    if (!container) {
      return;
    }

    try {
      this.eventBus.emit('mfe:unloading:start', { id });
      this._log(`Unloading module: ${id}`);

      const manifest = container.manifest;
      if (manifest?.remoteEntry) {
        await this.moduleLoader.unload(
          manifest.remoteEntry,
          manifest.scope
        );
      }

      container.loaded = false;
      container.component = undefined;

      this.eventBus.emit('mfe:unloading:complete', { id });
      this._log(`Module unloaded: ${id}`);
    } catch (error) {
      this.eventBus.emit('mfe:unloading:error', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      this._log(`Failed to unload module ${id}: ${error}`, 'error');
    }
  }

  /**
   * Mount an MFE to a DOM element
   */
  mountModule(id: string, target: HTMLElement | string): void {
    const element = typeof target === 'string'
      ? document.getElementById(target)
      : target;

    if (!element) {
      throw new Error(`Mount target not found: ${target}`);
    }

    const container = this.containers.get(id);
    if (!container) {
      throw new Error(`Container not registered: ${id}`);
    }

    if (!container.loaded) {
      throw new Error(`Module not loaded: ${id}`);
    }

    this.mountPoints.set(id, element);
    this.eventBus.emit('mfe:mounted', { id, target: element });
    this._log(`Module mounted: ${id}`);
  }

  /**
   * Unmount an MFE from DOM
   */
  unmountModule(id: string): void {
    this.mountPoints.delete(id);
    this.eventBus.emit('mfe:unmounted', { id });
    this._log(`Module unmounted: ${id}`);
  }

  /**
   * Get container by ID
   */
  getContainer(id: string): MFEContainer | undefined {
    return this.containers.get(id);
  }

  /**
   * Get all registered containers
   */
  getAllContainers(): MFEContainer[] {
    return Array.from(this.containers.values());
  }

  /**
   * Check if container is loaded
   */
  isLoaded(id: string): boolean {
    return this.containers.get(id)?.loaded ?? false;
  }

  /**
   * Setup automatic cleanup on page unload
   */
  private _setupCleanup(): void {
    if (!this.config.autoCleanup) {
      return;
    }

    window.addEventListener('beforeunload', async () => {
      await this.cleanup();
    });
  }

  /**
   * Cleanup all modules
   */
  async cleanup(): Promise<void> {
    const ids = Array.from(this.containers.keys());
    
    for (const id of ids) {
      try {
        await this.unloadModule(id);
      } catch (error) {
        this._log(`Error during cleanup of ${id}: ${error}`, 'error');
      }
    }

    this.containers.clear();
    this.mountPoints.clear();
    this._log('Runtime cleanup complete');
  }

  /**
   * Internal logging
   */
  private _log(message: string, level: 'log' | 'warn' | 'error' = 'log'): void {
    if (this.config.debug) {
      console[level](`[MFE Runtime] ${message}`);
    }
  }

  /**
   * Get runtime statistics
   */
  getStats(): {
    totalContainers: number;
    loadedContainers: number;
    mountedContainers: number;
  } {
    const loadedCount = Array.from(this.containers.values()).filter(
      c => c.loaded
    ).length;

    return {
      totalContainers: this.containers.size,
      loadedContainers: loadedCount,
      mountedContainers: this.mountPoints.size,
    };
  }
}

let globalRuntime: MFERuntime | null = null;

export const createRuntime = (config?: RuntimeConfig): MFERuntime => {
  return new MFERuntime(config);
};

export const getGlobalRuntime = (config?: RuntimeConfig): MFERuntime => {
  if (!globalRuntime) {
    globalRuntime = new MFERuntime(config);
  }
  return globalRuntime;
};

export { MFERuntime };
