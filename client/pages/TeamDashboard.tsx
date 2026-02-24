/**
 * Team Dashboard
 * Dynamic page that loads and displays MFEs from a specific team
 * Supports nested MFE loading and dynamic routing
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGlobalFederatedRegistry } from '@shared/mfe/federated-registry';
import { getGlobalRuntime } from '@shared/mfe/runtime';
import { getGlobalEventBus } from '@shared/mfe';
import NestedMFEHost from '@/components/NestedMFEHost';
import { cn } from '@/lib/utils';
import { AlertCircle, ArrowLeft, Loader, Settings } from 'lucide-react';

interface MFEListItem {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const TeamDashboard: React.FC = () => {
  const { teamId, mfeId } = useParams<{ teamId?: string; mfeId?: string }>();
  const navigate = useNavigate();
  
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [teamMFEs, setTeamMFEs] = useState<MFEListItem[]>([]);
  const [selectedMFE, setSelectedMFE] = useState<MFEListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const registryRef = React.useRef(getGlobalFederatedRegistry());
  const eventBusRef = React.useRef(getGlobalEventBus());
  const runtimeRef = React.useRef(getGlobalRuntime());

  /**
   * Load team info and MFEs
   */
  const loadTeamInfo = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!teamId) {
        throw new Error('Team ID not provided');
      }

      const team = registryRef.current.getTeamInfo(teamId);
      if (!team) {
        throw new Error(`Team not found: ${teamId}`);
      }

      setTeamInfo(team);

      // Convert team MFEs to list items
      const mfeList: MFEListItem[] = team.mfes.map(mfe => ({
        id: mfe.id,
        name: mfe.name,
        description: mfe.description || '',
        icon: mfe.icon || '📦',
      }));

      setTeamMFEs(mfeList);

      // If mfeId is in URL, select it
      if (mfeId) {
        const selected = mfeList.find(m => m.id.includes(mfeId));
        if (selected) {
          setSelectedMFE(selected);
        }
      }

      console.log(`[TeamDashboard] Loaded team: ${teamId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error('[TeamDashboard] Failed to load team:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId, mfeId]);

  /**
   * Load on mount or when teamId changes
   */
  useEffect(() => {
    loadTeamInfo();
  }, [loadTeamInfo]);

  /**
   * Handle MFE selection
   */
  const handleSelectMFE = useCallback((mfe: MFEListItem) => {
    setSelectedMFE(mfe);
    navigate(`/app/${teamId}/${mfe.id}`);
  }, [teamId, navigate]);

  /**
   * Go back to main page
   */
  const handleGoBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading team {teamId}...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h1 className="text-xl font-bold text-red-900 mb-2">
                  Failed to Load Team
                </h1>
                <p className="text-red-800">{error}</p>
                <button
                  onClick={loadTeamInfo}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {teamInfo?.teamName || teamId}
            </h1>
            <p className="text-gray-600">
              {teamInfo?.mfes?.length || 0} MFEs available
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span>Status: <span className="text-green-600 font-semibold">Ready</span></span>
              <span>Last Updated: {new Date(teamInfo?.lastUpdated).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* MFE List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow sticky top-8">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">MFEs</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {teamMFEs.length} available
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {teamMFEs.map(mfe => (
                  <button
                    key={mfe.id}
                    onClick={() => handleSelectMFE(mfe)}
                    className={cn(
                      'w-full text-left px-4 py-3 transition-colors hover:bg-blue-50',
                      selectedMFE?.id === mfe.id && 'bg-blue-50 border-l-4 border-blue-600'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{mfe.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{mfe.name}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {mfe.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* MFE Display Area */}
          <div className="lg:col-span-3">
            {selectedMFE ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* MFE Header */}
                <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-3xl">{selectedMFE.icon}</span>
                        {selectedMFE.name}
                      </h2>
                      <p className="text-gray-600 mt-1">{selectedMFE.description}</p>
                    </div>
                    <button className="p-2 hover:bg-white rounded-lg transition-colors">
                      <Settings className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* MFE Content */}
                <div className="p-6">
                  <NestedMFEHost
                    teamId={teamId || ''}
                    mfeId={selectedMFE.id.replace(`${teamId}-`, '')}
                    parentRuntime={runtimeRef.current}
                    onLoad={() => {
                      console.log(`[TeamDashboard] MFE loaded: ${selectedMFE.id}`);
                    }}
                    onError={(error) => {
                      console.error(`[TeamDashboard] MFE error:`, error);
                      setError(`Failed to load ${selectedMFE.name}: ${error.message}`);
                    }}
                    onUnload={() => {
                      console.log(`[TeamDashboard] MFE unloaded: ${selectedMFE.id}`);
                    }}
                    className="min-h-96"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-gray-400 text-5xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select an MFE to Load
                </h3>
                <p className="text-gray-600">
                  Choose an MFE from the list on the left to view its contents
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;
