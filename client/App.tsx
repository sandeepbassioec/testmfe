import "./global.css";

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

const queryClient = new QueryClient();

/**
 * Initialize federated MFE framework
 */
const initializeFederation = async () => {
  const config = getFederationConfig();

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

  console.log('[App] MFE Framework initialized with federated support');
};

// Initialize on app startup
initializeFederation().catch(err => {
  console.error('[App] Failed to initialize MFE Framework:', err);
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
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

createRoot(document.getElementById("root")!).render(<App />);
