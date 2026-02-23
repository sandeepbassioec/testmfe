import { useState, useEffect, useCallback } from 'react';
import { getGlobalMasterDataState } from '@shared/state-management/master-data-state';
import { getGlobalEventBus } from '@shared/mfe';
import type { MasterTableData } from '@shared/state-management/types';

interface UseMasterDataReturn<T extends MasterTableData> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
}

/**
 * Hook to fetch and cache master data
 */
export const useMasterData = <T extends MasterTableData>(
  tableName: string
): UseMasterDataReturn<T> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<
    'pending' | 'syncing' | 'synced' | 'failed'
  >('pending');

  const masterDataState = getGlobalMasterDataState();
  const eventBus = getGlobalEventBus();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await masterDataState.getData<T>(tableName);
      setData(result);
      setSyncStatus('synced');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setSyncStatus('failed');
    } finally {
      setLoading(false);
    }
  }, [tableName, masterDataState]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for sync events
  useEffect(() => {
    const unsubscribe1 = eventBus.on('state:sync:completed', (payload) => {
      if (payload.data.tableName === tableName) {
        fetchData();
        setSyncStatus('synced');
      }
    });

    const unsubscribe2 = eventBus.on('state:data:fetched', (payload) => {
      if (payload.data.tableName === tableName) {
        setSyncStatus('synced');
      }
    });

    const unsubscribe3 = eventBus.on('state:fetch:error', (payload) => {
      if (payload.data.tableName === tableName) {
        setSyncStatus('failed');
        setError(payload.data.error);
      }
    });

    return () => {
      unsubscribe1.unsubscribe();
      unsubscribe2.unsubscribe();
      unsubscribe3.unsubscribe();
    };
  }, [tableName, eventBus, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    syncStatus,
  };
};
