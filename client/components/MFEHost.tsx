import React, { useEffect, useState, useCallback } from 'react';
import { getGlobalRuntime, getGlobalRegistry, getGlobalEventBus } from '@shared/mfe';
import type { RegistryEntry, MFEContainer } from '@shared/mfe';
import { cn } from '@/lib/utils';
import Dashboard from './mfe-samples/Dashboard';
import Analytics from './mfe-samples/Analytics';
import Settings from './mfe-samples/Settings';
import MasterDataMFE from './mfe-samples/MasterDataMFE';

const componentMap: Record<string, React.ComponentType<any>> = {
  dashboard: Dashboard,
  analytics: Analytics,
  settings: Settings,
  masterdata: MasterDataMFE,
};

interface MFEHostProps {
  className?: string;
  onMFELoad?: (mfeId: string) => void;
  onMFEError?: (mfeId: string, error: Error) => void;
}

const MFEHost: React.FC<MFEHostProps> = ({
  className,
  onMFELoad,
  onMFEError,
}) => {
  const [containers, setContainers] = useState<MFEContainer[]>([]);
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const runtime = getGlobalRuntime({ debug: true, preloadModules: true });
  const registry = getGlobalRegistry();
  const eventBus = getGlobalEventBus();

  // Listen to event bus for updates
  useEffect(() => {
    const unsubscribe = eventBus.on('mfe:loading:start', (payload) => {
      setLoading(prev => new Set(prev).add(payload.data.id));
    });

    const unsubscribe2 = eventBus.on('mfe:loading:complete', (payload) => {
      setLoading(prev => {
        const next = new Set(prev);
        next.delete(payload.data.id);
        return next;
      });
      setContainers(runtime.getAllContainers());
      onMFELoad?.(payload.data.id);
    });

    const unsubscribe3 = eventBus.on('mfe:loading:error', (payload) => {
      setErrors(prev => new Map(prev).set(payload.data.id, payload.data.error));
      setLoading(prev => {
        const next = new Set(prev);
        next.delete(payload.data.id);
        return next;
      });
      onMFEError?.(payload.data.id, new Error(payload.data.error));
    });

    return () => {
      unsubscribe.unsubscribe();
      unsubscribe2.unsubscribe();
      unsubscribe3.unsubscribe();
    };
  }, [runtime, onMFELoad, onMFEError, eventBus]);

  const loadMFE = useCallback(async (entry: RegistryEntry) => {
    try {
      await runtime.loadModule(entry.id, entry.config);
    } catch (error) {
      console.error(`Failed to load MFE ${entry.id}:`, error);
    }
  }, [runtime]);

  const unloadMFE = useCallback(async (id: string) => {
    try {
      await runtime.unloadModule(id);
      setContainers(runtime.getAllContainers());
    } catch (error) {
      console.error(`Failed to unload MFE ${id}:`, error);
    }
  }, [runtime]);

  const stats = runtime.getStats();

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="text-sm text-blue-600 font-medium">Total MFEs</div>
          <div className="text-2xl font-bold text-blue-900">{stats.totalContainers}</div>
        </div>
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="text-sm text-green-600 font-medium">Loaded</div>
          <div className="text-2xl font-bold text-green-900">{stats.loadedContainers}</div>
        </div>
        <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
          <div className="text-sm text-purple-600 font-medium">Mounted</div>
          <div className="text-2xl font-bold text-purple-900">{stats.mountedContainers}</div>
        </div>
      </div>

      {/* MFE Registry */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Available MFEs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {registry.getAll().map(entry => {
            const isLoading = loading.has(entry.id);
            const error = errors.get(entry.id);
            const container = runtime.getContainer(entry.id);

            return (
              <div
                key={entry.id}
                className="rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {entry.icon && <span className="text-xl">{entry.icon}</span>}
                      <h4 className="font-semibold text-gray-900">{entry.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-1">
                  {entry.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {error && (
                  <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    Error: {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => !container?.loaded && loadMFE(entry)}
                    disabled={container?.loaded || isLoading}
                    className={cn(
                      'flex-1 px-3 py-2 text-sm font-medium rounded transition-colors',
                      container?.loaded
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : isLoading
                        ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-wait'
                        : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                    )}
                  >
                    {container?.loaded
                      ? '✓ Loaded'
                      : isLoading
                      ? 'Loading...'
                      : 'Load'}
                  </button>
                  {container?.loaded && (
                    <button
                      onClick={() => unloadMFE(entry.id)}
                      className="flex-1 px-3 py-2 text-sm font-medium rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                    >
                      Unload
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loaded Containers */}
      {containers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Loaded Containers</h3>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div className="space-y-2">
              {containers.map(container => (
                <div
                  key={container.id}
                  className="flex items-center justify-between p-3 bg-white rounded border border-gray-200"
                >
                  <div>
                    <div className="font-medium text-gray-900">{container.name}</div>
                    <div className="text-xs text-gray-500">{container.id}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {container.loaded && (
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                    <span className="text-sm text-gray-600">
                      {container.loaded ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rendered MFE Components */}
      {containers.length > 0 && (
        <div className="space-y-8 mt-8 border-t border-gray-200 pt-8">
          {containers.map(container => {
            const Component = componentMap[container.id];
            if (!Component) return null;

            return (
              <div key={container.id} className="space-y-4">
                <Component />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MFEHost;
