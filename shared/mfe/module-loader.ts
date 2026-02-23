/**
 * Module Loader
 * Handles dynamic loading of MFE modules at runtime
 */

import type { LoaderOptions, MFEModule } from './types';

interface LoadedModule {
  module: MFEModule;
  loadedAt: number;
  retries: number;
}

class ModuleLoader {
  private cache: Map<string, LoadedModule> = new Map();
  private loading: Map<string, Promise<MFEModule>> = new Map();
  private defaultOptions: Required<LoaderOptions> = {
    timeout: 30000,
    retry: 3,
    fallback: undefined as any,
  };

  /**
   * Load a module by URL
   */
  async load(
    url: string,
    scope: string,
    options: LoaderOptions = {}
  ): Promise<MFEModule> {
    const opts = { ...this.defaultOptions, ...options };
    const cacheKey = `${url}::${scope}`;

    // Return cached module if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!.module;
    }

    // Return existing promise if already loading
    if (this.loading.has(cacheKey)) {
      return this.loading.get(cacheKey)!;
    }

    // Start new load
    const loadPromise = this._loadWithRetry(url, scope, opts);
    this.loading.set(cacheKey, loadPromise);

    try {
      const module = await loadPromise;
      this.cache.set(cacheKey, {
        module,
        loadedAt: Date.now(),
        retries: 0,
      });
      return module;
    } finally {
      this.loading.delete(cacheKey);
    }
  }

  /**
   * Load module with automatic retry logic
   */
  private async _loadWithRetry(
    url: string,
    scope: string,
    options: Required<LoaderOptions>,
    attempt = 1
  ): Promise<MFEModule> {
    try {
      const module = await this._loadModule(url, scope, options.timeout);
      
      if (module.init) {
        await Promise.resolve(module.init());
      }
      
      return module;
    } catch (error) {
      if (attempt < options.retry) {
        // Exponential backoff: 100ms, 300ms, 1000ms
        const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._loadWithRetry(url, scope, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Load module from remote URL
   */
  private async _loadModule(
    url: string,
    scope: string,
    timeout: number
  ): Promise<MFEModule> {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Module loading timeout after ${timeout}ms`)),
        timeout
      )
    );

    // Load remote entry script
    const loadPromise = this._injectScript(url, scope);

    return Promise.race([loadPromise, timeoutPromise]);
  }

  /**
   * Inject and load remote entry script
   */
  private _injectScript(url: string, scope: string): Promise<MFEModule> {
    return new Promise((resolve, reject) => {
      try {
        // Check if script already loaded
        const globalScope = window as any;
        if (globalScope[scope]) {
          resolve(globalScope[scope] as MFEModule);
          return;
        }

        const script = document.createElement('script');
        script.src = url;
        script.type = 'text/javascript';
        script.async = true;

        script.onload = () => {
          if (globalScope[scope]) {
            resolve(globalScope[scope] as MFEModule);
          } else {
            reject(new Error(`Module ${scope} not found after loading`));
          }
        };

        script.onerror = () => {
          reject(new Error(`Failed to load script from ${url}`));
        };

        document.body.appendChild(script);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Unload a module and cleanup
   */
  async unload(url: string, scope: string): Promise<void> {
    const cacheKey = `${url}::${scope}`;
    const cached = this.cache.get(cacheKey);

    if (cached) {
      if (cached.module.destroy) {
        await Promise.resolve(cached.module.destroy());
      }
      this.cache.delete(cacheKey);
    }

    // Remove script from DOM
    const scripts = document.querySelectorAll(`script[src="${url}"]`);
    scripts.forEach(script => script.remove());

    // Remove from global scope
    const globalScope = window as any;
    delete globalScope[scope];
  }

  /**
   * Preload a module without executing it
   */
  async preload(url: string, scope: string): Promise<void> {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = url;
    document.head.appendChild(link);
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Clear all cached modules
   */
  async clearCache(): Promise<void> {
    for (const cached of this.cache.values()) {
      if (cached.module.destroy) {
        await Promise.resolve(cached.module.destroy());
      }
    }
    this.cache.clear();
  }

  /**
   * Get cache info
   */
  getCacheInfo(): Array<{ key: string; timestamp: number }> {
    return Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      timestamp: value.loadedAt,
    }));
  }
}

// Global module loader instance
let globalLoader: ModuleLoader | null = null;

export const createModuleLoader = (): ModuleLoader => {
  return new ModuleLoader();
};

export const getGlobalModuleLoader = (): ModuleLoader => {
  if (!globalLoader) {
    globalLoader = new ModuleLoader();
  }
  return globalLoader;
};

export { ModuleLoader };
