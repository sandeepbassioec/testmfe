/**
 * Micro Frontend Framework
 * Production-ready MFE framework with Module Loader, Runtime, Event Bus, HTTP API, and Registry
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

/**
 * Initialize MFE Framework with default global instances
 */
export function initializeMFEFramework(config?: {
  debug?: boolean;
  baseApiUrl?: string;
  registryUrl?: string;
  preloadModules?: boolean;
}) {
  const { getGlobalEventBus } = require('./event-bus');
  const { getGlobalModuleLoader } = require('./module-loader');
  const { getGlobalRuntime } = require('./runtime');
  const { getGlobalRegistry } = require('./registry');
  const { getGlobalHttpApi } = require('./http-api');

  // Initialize all global instances
  getGlobalEventBus();
  getGlobalModuleLoader();
  getGlobalRuntime({ debug: config?.debug, preloadModules: config?.preloadModules });
  getGlobalRegistry(config?.registryUrl);
  getGlobalHttpApi(config?.baseApiUrl);

  if (config?.debug) {
    console.log('[MFE Framework] Initialized with global instances');
  }
}
