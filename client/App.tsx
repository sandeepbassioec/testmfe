import "./global.css";

import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { initializeMFEFramework } from "@shared/mfe";
import { getFederationConfig } from "./federation.config";
import Index from "./pages/Index";
import Documentation from "./pages/Documentation";
import Admin from "./pages/Admin";
import TeamDashboard from "./pages/TeamDashboard";
import NotFound from "./pages/NotFound";
import Simple from "./pages/Simple";

const queryClient = new QueryClient();

const App = () => {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeFederation = async () => {
      try {
        const config = getFederationConfig();
        console.log('[App] Starting MFE Framework initialization...');

        initializeMFEFramework({
          debug: process.env.NODE_ENV === 'development',
          baseApiUrl: config.orchestrator.url,
          federated: {
            enabled: true,
            localTeamId: 'local',
            teams: config.teams.map(t => ({
              teamId: t.teamId,
              manifestUrl: t.manifestUrl,
            })),
            autoDiscover: true,
          },
        });

        console.log('[App] Base MFE Framework initialized');

        // Initialize federated registry with team config
        const { getGlobalFederatedRegistry } = await import('@shared/mfe');
        const federatedRegistry = getGlobalFederatedRegistry({
          localTeamId: 'local',
          teams: config.teams.map(t => ({
            teamId: t.teamId,
            manifestUrl: t.manifestUrl,
          })),
          autoDiscover: true,
        });

        console.log('[App] Federated registry created, starting team discovery...');

        // Wait for team discovery
        await federatedRegistry.initialize({
          localTeamId: 'local',
          teams: config.teams.map(t => ({
            teamId: t.teamId,
            manifestUrl: t.manifestUrl,
          })),
          autoDiscover: true,
        });

        console.log('[App] MFE Framework initialization complete!');
        setInitialized(true);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('[App] MFE Framework initialization error:', errorMsg);
        setError(errorMsg);
        setInitialized(true); // Still allow app to render
      }
    };

    initializeFederation();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {error && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              padding: '20px',
              backgroundColor: '#dc2626',
              color: 'white',
              zIndex: 9999,
            }}
          >
            ⚠️ Initialization Error: {error}
          </div>
        )}
        <BrowserRouter>
          <Routes>
            {/* Debug routes */}
            <Route path="/simple" element={<Simple />} />

            {/* Main routes */}
            <Route path="/" element={<Index />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/admin" element={<Admin />} />

            {/* Federated team routes */}
            <Route path="/app/:teamId/*" element={<TeamDashboard />} />
            <Route path="/app/:teamId/:mfeId/*" element={<TeamDashboard />} />

            {/* Catch-all - must be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Add error handling
window.addEventListener('error', (event) => {
  console.error('[App] Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[App] Unhandled promise rejection:', event.reason);
});

console.log('[App] Application starting...');
console.log('[App] Current URL:', window.location.href);
console.log('[App] Document ready state:', document.readyState);

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('[App] Root element with id="root" not found!');
  console.error('[App] DOM content:',  document.body.innerHTML.substring(0, 500));

  // Fallback: create root element
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  newRoot.textContent = 'ERROR: Root element not found!';
  document.body.appendChild(newRoot);
} else {
  console.log('[App] Root element found, mounting React app');
  try {
    createRoot(rootElement).render(<App />);
    console.log('[App] React app mounted successfully!');
  } catch (err) {
    console.error('[App] Error mounting React app:', err);
  }
}
