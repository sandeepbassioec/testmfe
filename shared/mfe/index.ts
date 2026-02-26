/**
 * Micro Frontend Framework
 * Production-ready MFE framework with Module Loader, Runtime, Event Bus, HTTP API, and Registry
 * Includes Federated Module Loading support for multi-team deployments
 */

// Core types
export * from './types';

// Event Bus
export {
  EventBus,
  createEventBus,
  getGlobalEventBus,
  resetEventBus,
} from './event-bus';

// Module Loader
export {
  ModuleLoader,
  createModuleLoader,
  getGlobalModuleLoader,
} from './module-loader';

// Runtime
export {
  MFERuntime,
  createRuntime,
  getGlobalRuntime,
} from './runtime';

// Registry
export {
  MFERegistry,
  createRegistry,
  getGlobalRegistry,
  SAMPLE_REGISTRY_ENTRIES,
} from './registry';

// HTTP API Framework
export {
  HttpApi,
  createHttpApi,
  getGlobalHttpApi,
  type ApiRequestOptions,
  type ApiResponse,
  type ApiError,
} from './http-api';

// Federated Module Federation Support
export {
  FederatedModuleLoader,
  getGlobalFederatedLoader,
  type TeamManifest,
  type RemoteModuleConfig,
  type SharedDependency,
} from './federated-loader';

export {
  FederatedRegistry,
  getGlobalFederatedRegistry,
  resetFederatedRegistry,
  type TeamInfo,
  type TeamConfig,
  type FederatedRegistryConfig,
} from './federated-registry';

/**
 * Initialize MFE Framework with default global instances
 * Supports both traditional and federated (multi-team) setups
 */
export function initializeMFEFramework(config?: {
  debug?: boolean;
  baseApiUrl?: string;
  registryUrl?: string;
  preloadModules?: boolean;
  federated?: {
    enabled: boolean;
    localTeamId?: string;
    teams: Array<{ teamId: string; manifestUrl: string }>;
    autoDiscover?: boolean;
  };
}) {
  const { getGlobalEventBus } = require('./event-bus');
  const { getGlobalModuleLoader } = require('./module-loader');
  const { getGlobalRuntime } = require('./runtime');
  const { getGlobalRegistry } = require('./registry');
  const { getGlobalHttpApi } = require('./http-api');
  const { getGlobalFederatedLoader } = require('./federated-loader');
  const { getGlobalFederatedRegistry } = require('./federated-registry');

  // Initialize base instances
  getGlobalEventBus();
  getGlobalModuleLoader();
  getGlobalRuntime({ debug: config?.debug, preloadModules: config?.preloadModules });
  getGlobalRegistry(config?.registryUrl);
  getGlobalHttpApi(config?.baseApiUrl);

  // Initialize federated components if enabled
  if (config?.federated?.enabled) {
    getGlobalFederatedLoader();

    const federatedRegistry = getGlobalFederatedRegistry({
      localTeamId: config.federated.localTeamId,
      teams: config.federated.teams || [],
      autoDiscover: config.federated.autoDiscover !== false,
    });

    if (config?.debug) {
      console.log('[MFE Framework] Federated registry initialized');
    }
  }

  if (config?.debug) {
    console.log('[MFE Framework] Initialized with global instances');
  }
}
