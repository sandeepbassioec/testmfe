/**
 * Nested MFE Host
 * Container for loading nested MFEs with isolated runtime and state
 * Supports dynamic loading/unloading with proper cleanup
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getGlobalFederatedLoader } from '@shared/mfe/federated-loader';
import { getGlobalFederatedRegistry } from '@shared/mfe/federated-registry';
import { getGlobalRuntime } from '@shared/mfe/runtime';
import { getGlobalEventBus } from '@shared/mfe';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw, Loader } from 'lucide-react';

export interface NestedMFEHostProps {
  teamId: string;
  mfeId: string;
  parentRuntime?: any;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onUnload?: () => void;
  className?: string;
  fallbackComponent?: React.ComponentType<{ error?: Error }>;
  timeout?: number;
}

interface MFEState {
  loading: boolean;
  error: Error | null;
  loaded: boolean;
  component: any;
}

/**
 * Nested MFE Host Component
 * Dynamically loads and renders nested MFEs with complete lifecycle management
 */
const NestedMFEHost: React.FC<NestedMFEHostProps> = ({
  teamId,
  mfeId,
  parentRuntime,
  onLoad,
  onError,
  onUnload,
  className,
  fallbackComponent: FallbackComponent,
  timeout = 30000,
}) => {
  const [state, setState] = useState<MFEState>({
    loading: true,
    error: null,
    loaded: false,
    component: null,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const mfeInstanceRef = useRef<any>(null);
  const cleanupRef = useRef<(() => void)[]>([]);
  const eventBusRef = useRef(getGlobalEventBus());
  const federatedLoaderRef = useRef(getGlobalFederatedLoader());
  const registryRef = useRef(getGlobalFederatedRegistry());
  const runtimeRef = useRef(parentRuntime || getGlobalRuntime());

  const fullMfeId = `${teamId}-${mfeId}`;

  /**
   * Load the nested MFE
   */
  const loadMFE = useCallback(async () => {
    if (state.loaded || state.loading) return;

    setState({ loading: true, error: null, loaded: false, component: null });

    try {
      console.log(`[NestedMFEHost] Loading: ${fullMfeId}`);

      // Get MFE remote config from registry
      const mfeEntry = registryRef.current.getByTeamAndId(teamId, mfeId);
      if (!mfeEntry) {
        throw new Error(`MFE not found in registry: ${fullMfeId}`);
      }

      const remoteConfig = registryRef.current.getMFERemoteConfig(fullMfeId);
      if (!remoteConfig) {
        throw new Error(`Invalid remote configuration for: ${fullMfeId}`);
      }

      // Load module from federated loader
      const module = await federatedLoaderRef.current.loadRemoteModule({
        ...remoteConfig,
        timeout,
      });

      if (!module || !module.default) {
        throw new Error(`Module has no default export: ${fullMfeId}`);
      }

      // Get component (handle both class and functional components)
      const Component = module.default;

      // Mount into container
      if (containerRef.current) {
        const instance = new Component({
          parentRuntime: runtimeRef.current,
          eventBus: eventBusRef.current,
          teamId,
          mfeId,
        });

        mfeInstanceRef.current = instance;

        // Store cleanup functions
        if (typeof instance.unmount === 'function') {
          cleanupRef.current.push(() => instance.unmount());
        }

        // Setup event bus cleanup
        const unsubscribe = eventBusRef.current.on('*', (event) => {
          // Pass events to nested MFE if it has event handler
          if (typeof instance.handleEvent === 'function') {
            instance.handleEvent(event);
          }
        });
        cleanupRef.current.push(() => unsubscribe.unsubscribe());
      }

      setState({
        loading: false,
        error: null,
        loaded: true,
        component: module.default,
      });

      // Emit load event
      eventBusRef.current.emit('mfe:nested:loaded', {
        teamId,
        mfeId,
        timestamp: new Date().toISOString(),
      });

      onLoad?.();
      console.log(`[NestedMFEHost] Loaded successfully: ${fullMfeId}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        loading: false,
        error: err,
        loaded: false,
        component: null,
      });

      // Emit error event
      eventBusRef.current.emit('mfe:nested:error', {
        teamId,
        mfeId,
        error: err.message,
        timestamp: new Date().toISOString(),
      });

      onError?.(err);
      console.error(`[NestedMFEHost] Failed to load: ${fullMfeId}`, err);
    }
  }, [teamId, mfeId, fullMfeId, state.loaded, state.loading, timeout, onLoad, onError]);

  /**
   * Unload the nested MFE
   */
  const unloadMFE = useCallback(() => {
    if (!state.loaded) return;

    try {
      console.log(`[NestedMFEHost] Unloading: ${fullMfeId}`);

      // Run cleanup functions
      cleanupRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (err) {
          console.error(`[NestedMFEHost] Cleanup error:`, err);
        }
      });
      cleanupRef.current = [];

      // Clear MFE instance
      mfeInstanceRef.current = null;

      // Clear container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      setState({
        loading: false,
        error: null,
        loaded: false,
        component: null,
      });

      // Emit unload event
      eventBusRef.current.emit('mfe:nested:unloaded', {
        teamId,
        mfeId,
        timestamp: new Date().toISOString(),
      });

      onUnload?.();
      console.log(`[NestedMFEHost] Unloaded: ${fullMfeId}`);
    } catch (error) {
      console.error(`[NestedMFEHost] Error during unload:`, error);
    }
  }, [teamId, mfeId, fullMfeId, state.loaded, onUnload]);

  /**
   * Load on mount
   */
  useEffect(() => {
    loadMFE();

    return () => {
      unloadMFE();
    };
  }, [loadMFE, unloadMFE]);

  /**
   * Error boundary fallback
   */
  if (state.error) {
    if (FallbackComponent) {
      return <FallbackComponent error={state.error} />;
    }

    return (
      <div className={cn('p-4 bg-red-50 rounded-lg border border-red-200', className)}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Failed to load MFE</h3>
            <p className="text-sm text-red-800 mt-1">{state.error.message}</p>
            <button
              onClick={() => setState({ ...state, error: null, loading: false })}
              className="mt-3 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Loading state
   */
  if (state.loading) {
    return (
      <div className={cn('p-8 flex items-center justify-center bg-gray-50 rounded-lg', className)}>
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Loading {fullMfeId}...</p>
        </div>
      </div>
    );
  }

  /**
   * Render loaded component or empty container
   */
  return (
    <div
      ref={containerRef}
      id={`nested-mfe-${fullMfeId}`}
      className={cn('nested-mfe-container', className)}
      data-team-id={teamId}
      data-mfe-id={mfeId}
      data-mfe-status={state.loaded ? 'ready' : 'unloaded'}
    >
      {state.component && <state.component />}
    </div>
  );
};

export default NestedMFEHost;
