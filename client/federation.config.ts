/**
 * Federation Configuration
 * Defines teams, their manifests, shared dependencies, and deployment settings
 */

export interface FederationConfig {
  orchestrator: {
    name: string;
    url: string;
    port: number;
  };
  sharedDependencies: Record<string, string>;
  teams: Array<{
    teamId: string;
    name: string;
    manifestUrl: string;
    priority: number; // Load priority (lower = first)
    timeout: number;
    retries: number;
    fallbackUrl?: string; // Fallback if primary fails
    healthCheckUrl?: string;
    environment: 'development' | 'staging' | 'production';
  }>;
  features: {
    enableVersionChecking: boolean;
    enableSignatureVerification: boolean;
    enablePerformanceMonitoring: boolean;
    enableErrorTracking: boolean;
    enableDynamicImportMap: boolean;
  };
  security: {
    enableCORS: boolean;
    corsOrigins: string[];
    enableCSP: boolean;
    cspPolicy: string;
    enableRateLimiting: boolean;
    rateLimitWindow: number;
    rateLimitMaxRequests: number;
  };
  caching: {
    manifestCacheTTL: number; // ms
    moduleCacheTTL: number; // ms
    enableBrowserCache: boolean;
    enableServiceWorker: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableRemoteLogging: boolean;
    remoteLoggingUrl?: string;
  };
}

/**
 * Production Configuration
 */
export const productionConfig: FederationConfig = {
  orchestrator: {
    name: 'MFE Orchestrator',
    url: process.env.VITE_ORCHESTRATOR_URL || 'https://app.company.com',
    port: 8080,
  },

  sharedDependencies: {
    react: 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm',
    'react-dom': 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm',
    'react-router-dom': 'https://cdn.jsdelivr.net/npm/react-router-dom@6.14.0/+esm',
  },

  teams: [
    {
      teamId: 'team-a',
      name: 'Team A - Core Platform',
      manifestUrl:
        process.env.VITE_TEAM_A_MANIFEST ||
        'https://team-a.company.com/api/mfe/manifest',
      priority: 1, // Load first
      timeout: 10000,
      retries: 3,
      fallbackUrl: 'https://team-a-backup.company.com/api/mfe/manifest',
      healthCheckUrl: 'https://team-a.company.com/health',
      environment: 'production',
    },
    {
      teamId: 'team-b',
      name: 'Team B - Reporting & Insights',
      manifestUrl:
        process.env.VITE_TEAM_B_MANIFEST ||
        'https://team-b.company.com/api/mfe/manifest',
      priority: 2,
      timeout: 10000,
      retries: 3,
      fallbackUrl: 'https://team-b-backup.company.com/api/mfe/manifest',
      healthCheckUrl: 'https://team-b.company.com/health',
      environment: 'production',
    },
    {
      teamId: 'team-c',
      name: 'Team C - Billing & Commerce',
      manifestUrl:
        process.env.VITE_TEAM_C_MANIFEST ||
        'https://team-c.company.com/api/mfe/manifest',
      priority: 3,
      timeout: 10000,
      retries: 3,
      fallbackUrl: 'https://team-c-backup.company.com/api/mfe/manifest',
      healthCheckUrl: 'https://team-c.company.com/health',
      environment: 'production',
    },
  ],

  features: {
    enableVersionChecking: true,
    enableSignatureVerification: true,
    enablePerformanceMonitoring: true,
    enableErrorTracking: true,
    enableDynamicImportMap: true,
  },

  security: {
    enableCORS: true,
    corsOrigins: [
      'https://team-a.company.com',
      'https://team-b.company.com',
      'https://team-c.company.com',
      'https://app.company.com',
    ],
    enableCSP: true,
    cspPolicy:
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://team-a.company.com https://team-b.company.com https://team-c.company.com https://cdn.jsdelivr.net",
    enableRateLimiting: true,
    rateLimitWindow: 60000, // 1 minute
    rateLimitMaxRequests: 1000,
  },

  caching: {
    manifestCacheTTL: 3600000, // 1 hour
    moduleCacheTTL: 86400000, // 24 hours
    enableBrowserCache: true,
    enableServiceWorker: true,
  },

  logging: {
    level: 'info',
    enableConsole: false,
    enableRemoteLogging: true,
    remoteLoggingUrl: 'https://logs.company.com/api/logs',
  },
};

/**
 * Development Configuration
 */
export const developmentConfig: FederationConfig = {
  orchestrator: {
    name: 'MFE Orchestrator (Dev)',
    url: 'http://localhost:8080',
    port: 8080,
  },

  sharedDependencies: {
    react: 'http://localhost:3001/react.js',
    'react-dom': 'http://localhost:3001/react-dom.js',
    'react-router-dom': 'http://localhost:3001/react-router-dom.js',
  },

  teams: [
    {
      teamId: 'team-a',
      name: 'Team A - Core Platform (Dev)',
      manifestUrl: 'http://localhost:5173/manifests/team-a-manifest.json',
      priority: 1,
      timeout: 15000,
      retries: 5,
      healthCheckUrl: 'http://localhost:5173/health',
      environment: 'development',
    },
    {
      teamId: 'team-b',
      name: 'Team B - Reporting (Dev)',
      manifestUrl: 'http://localhost:5174/manifests/team-b-manifest.json',
      priority: 2,
      timeout: 15000,
      retries: 5,
      healthCheckUrl: 'http://localhost:5174/health',
      environment: 'development',
    },
    {
      teamId: 'team-c',
      name: 'Team C - Billing (Dev)',
      manifestUrl: 'http://localhost:5175/manifests/team-c-manifest.json',
      priority: 3,
      timeout: 15000,
      retries: 5,
      healthCheckUrl: 'http://localhost:5175/health',
      environment: 'development',
    },
  ],

  features: {
    enableVersionChecking: false,
    enableSignatureVerification: false,
    enablePerformanceMonitoring: true,
    enableErrorTracking: true,
    enableDynamicImportMap: true,
  },

  security: {
    enableCORS: true,
    corsOrigins: ['*'], // Allow all in dev
    enableCSP: false,
    cspPolicy: '',
    enableRateLimiting: false,
    rateLimitWindow: 0,
    rateLimitMaxRequests: 0,
  },

  caching: {
    manifestCacheTTL: 5000, // 5 seconds (for development)
    moduleCacheTTL: 5000,
    enableBrowserCache: false,
    enableServiceWorker: false,
  },

  logging: {
    level: 'debug',
    enableConsole: true,
    enableRemoteLogging: false,
  },
};

/**
 * Get configuration based on environment
 */
export function getFederationConfig(): FederationConfig {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'production') {
    return productionConfig;
  }

  return developmentConfig;
}

/**
 * Validate configuration
 */
export function validateFederationConfig(config: FederationConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate orchestrator
  if (!config.orchestrator.url) {
    errors.push('Orchestrator URL is required');
  }

  // Validate teams
  if (!config.teams || config.teams.length === 0) {
    errors.push('At least one team must be configured');
  }

  for (const team of config.teams || []) {
    if (!team.teamId) {
      errors.push(`Team missing teamId`);
    }
    if (!team.manifestUrl) {
      errors.push(`Team ${team.teamId} missing manifestUrl`);
    }
  }

  // Validate shared dependencies
  if (!config.sharedDependencies || Object.keys(config.sharedDependencies).length === 0) {
    errors.push('At least one shared dependency should be defined');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
