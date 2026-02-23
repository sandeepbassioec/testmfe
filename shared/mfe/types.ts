/**
 * Core type definitions for the Micro Frontend Framework
 */

export interface MFEModule {
  name: string;
  version: string;
  init?: () => void | Promise<void>;
  destroy?: () => void | Promise<void>;
}

export interface MFEManifest {
  name: string;
  version: string;
  scope: string;
  module: string;
  remoteEntry?: string;
  exposes: Record<string, string>;
  shared?: Record<string, SharedDependency>;
  loaded?: boolean;
}

export interface SharedDependency {
  singleton: boolean;
  strictVersion: boolean;
  requiredVersion?: string;
}

export interface MFEContainer {
  id: string;
  name: string;
  loaded: boolean;
  component?: React.ComponentType<any>;
  manifest?: MFEManifest;
}

export interface MFEConfig {
  id: string;
  scope: string;
  module: string;
  remoteEntry?: string;
  exposes: Record<string, string>;
}

export interface EventPayload {
  type: string;
  source: string;
  timestamp: number;
  data?: any;
}

export interface EventSubscription {
  unsubscribe: () => void;
}

export interface RegistryEntry {
  id: string;
  name: string;
  description: string;
  version: string;
  scope: string;
  module: string;
  tags: string[];
  icon?: string;
  config: MFEConfig;
}

export interface LoaderOptions {
  timeout?: number;
  retry?: number;
  fallback?: React.ComponentType<any>;
}
