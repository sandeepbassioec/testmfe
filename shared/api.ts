/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * MFE Registry API Responses
 */
export interface RegistryListResponse {
  entries: Array<{
    id: string;
    name: string;
    description: string;
    version: string;
    tags: string[];
    icon?: string;
  }>;
  total: number;
}

export interface RegistryEntryResponse {
  id: string;
  name: string;
  description: string;
  version: string;
  scope: string;
  module: string;
  tags: string[];
  icon?: string;
  config: {
    id: string;
    scope: string;
    module: string;
    remoteEntry?: string;
    exposes: Record<string, string>;
  };
}

/**
 * MFE Analytics API
 */
export interface MFEMetrics {
  mfeId: string;
  loadTime: number;
  timestamp: number;
  success: boolean;
  errorMessage?: string;
}

export interface MFEHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  loadedMFEs: number;
  totalMFEs: number;
  metrics: MFEMetrics[];
}
