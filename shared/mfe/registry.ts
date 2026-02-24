/**
 * MFE Registry
 * Central registry for discovering, managing, and querying available MFEs
 */

import { getGlobalEventBus } from './event-bus';
import type { MFEConfig, RegistryEntry } from './types';

// Export RegistryEntry for use in other modules
export type { RegistryEntry };

class MFERegistry {
  private entries: Map<string, RegistryEntry> = new Map();
  private eventBus = getGlobalEventBus();
  private remoteRegistryUrl: string | null = null;

  constructor(remoteUrl?: string) {
    this.remoteRegistryUrl = remoteUrl || null;
  }

  /**
   * Register an MFE in the registry
   */
  register(entry: RegistryEntry): void {
    if (this.entries.has(entry.id)) {
      throw new Error(`MFE ${entry.id} already registered`);
    }

    this.entries.set(entry.id, entry);
    this.eventBus.emit('registry:entry:registered', { id: entry.id, entry });
  }

  /**
   * Unregister an MFE from the registry
   */
  unregister(id: string): void {
    this.entries.delete(id);
    this.eventBus.emit('registry:entry:unregistered', { id });
  }

  /**
   * Get a registry entry by ID
   */
  get(id: string): RegistryEntry | undefined {
    return this.entries.get(id);
  }

  /**
   * Get all registered MFEs
   */
  getAll(): RegistryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Search MFEs by tag
   */
  findByTag(tag: string): RegistryEntry[] {
    return Array.from(this.entries.values()).filter(entry =>
      entry.tags.includes(tag)
    );
  }

  /**
   * Search MFEs by name (partial match)
   */
  findByName(name: string): RegistryEntry[] {
    const lowerName = name.toLowerCase();
    return Array.from(this.entries.values()).filter(entry =>
      entry.name.toLowerCase().includes(lowerName)
    );
  }

  /**
   * Search MFEs by description (partial match)
   */
  search(query: string): RegistryEntry[] {
    const lower = query.toLowerCase();
    return Array.from(this.entries.values()).filter(entry =>
      entry.name.toLowerCase().includes(lower) ||
      entry.description.toLowerCase().includes(lower) ||
      entry.tags.some(tag => tag.toLowerCase().includes(lower))
    );
  }

  /**
   * Get MFE configuration
   */
  getConfig(id: string): MFEConfig | undefined {
    const entry = this.entries.get(id);
    return entry?.config;
  }

  /**
   * Load remote registry entries
   */
  async loadRemoteRegistry(): Promise<void> {
    if (!this.remoteRegistryUrl) {
      throw new Error('No remote registry URL configured');
    }

    try {
      const response = await fetch(this.remoteRegistryUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch registry: ${response.statusText}`);
      }

      const entries: RegistryEntry[] = await response.json();
      entries.forEach(entry => this.register(entry));

      this.eventBus.emit('registry:loaded', { count: entries.length });
    } catch (error) {
      this.eventBus.emit('registry:load:error', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Export registry as JSON
   */
  export(): RegistryEntry[] {
    return this.getAll();
  }

  /**
   * Import registry from JSON
   */
  import(entries: RegistryEntry[]): void {
    entries.forEach(entry => {
      if (!this.entries.has(entry.id)) {
        this.register(entry);
      }
    });
  }

  /**
   * Clear registry
   */
  clear(): void {
    this.entries.clear();
    this.eventBus.emit('registry:cleared', {});
  }

  /**
   * Get registry size
   */
  size(): number {
    return this.entries.size;
  }

  /**
   * Get unique tags
   */
  getTags(): string[] {
    const tags = new Set<string>();
    this.entries.forEach(entry => {
      entry.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  /**
   * Validate MFE configuration
   */
  validateEntry(entry: RegistryEntry): string[] {
    const errors: string[] = [];

    if (!entry.id || entry.id.trim() === '') {
      errors.push('ID is required');
    }

    if (!entry.name || entry.name.trim() === '') {
      errors.push('Name is required');
    }

    if (!entry.config.scope || entry.config.scope.trim() === '') {
      errors.push('Scope is required');
    }

    if (!entry.config.module || entry.config.module.trim() === '') {
      errors.push('Module is required');
    }

    if (!entry.tags || entry.tags.length === 0) {
      errors.push('At least one tag is required');
    }

    return errors;
  }
}

// Sample registry entries for demo
export const SAMPLE_REGISTRY_ENTRIES: RegistryEntry[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Main dashboard with analytics and overview',
    version: '1.0.0',
    scope: 'dashboard',
    module: './Dashboard',
    tags: ['dashboard', 'analytics', 'overview'],
    icon: '📊',
    config: {
      id: 'dashboard',
      scope: 'dashboard',
      module: 'dashboard',
      exposes: {
        './Dashboard': './src/Dashboard',
      },
    },
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Detailed analytics and reporting',
    version: '1.0.0',
    scope: 'analytics',
    module: './Analytics',
    tags: ['analytics', 'reporting', 'charts'],
    icon: '📈',
    config: {
      id: 'analytics',
      scope: 'analytics',
      module: 'analytics',
      exposes: {
        './Analytics': './src/Analytics',
      },
    },
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Application settings and configuration',
    version: '1.0.0',
    scope: 'settings',
    module: './Settings',
    tags: ['settings', 'config', 'preferences'],
    icon: '⚙️',
    config: {
      id: 'settings',
      scope: 'settings',
      module: 'settings',
      exposes: {
        './Settings': './src/Settings',
      },
    },
  },
  {
    id: 'masterdata',
    name: 'Master Data Management',
    description: 'Centralized state management with IndexedDB caching and background sync',
    version: '1.0.0',
    scope: 'masterdata',
    module: './MasterDataMFE',
    tags: ['state', 'caching', 'database', 'sync'],
    icon: '💾',
    config: {
      id: 'masterdata',
      scope: 'masterdata',
      module: 'masterdata',
      exposes: {
        './MasterDataMFE': './src/MasterDataMFE',
      },
    },
  },
];

let globalRegistry: MFERegistry | null = null;

export const createRegistry = (remoteUrl?: string): MFERegistry => {
  return new MFERegistry(remoteUrl);
};

export const getGlobalRegistry = (remoteUrl?: string): MFERegistry => {
  if (!globalRegistry) {
    globalRegistry = new MFERegistry(remoteUrl);
    // Initialize with sample entries
    SAMPLE_REGISTRY_ENTRIES.forEach(entry => {
      globalRegistry!.register(entry);
    });
  }
  return globalRegistry;
};

export { MFERegistry };
