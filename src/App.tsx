import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { IncidentsProvider } from "@/context/IncidentsContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { ActivityProvider } from "@/context/ActivityContext";
import { SimulationProvider } from "@/context/SimulationContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Incidents from "./pages/Incidents";
import Alerts from "./pages/Alerts";
import Evidence from "./pages/Evidence";
import Team from "./pages/Team";
import Enrichment from "./pages/Enrichment";
import Activity from "./pages/Activity";
import Settings from "./pages/Settings";
import Documentation from "./pages/Documentation";
import Auth from "./pages/Auth";
import AuditLog from "./pages/AuditLog";
import Playbooks from "./pages/Playbooks";
import MitreMapping from "./pages/MitreMapping";
import LogIngestion from "./pages/LogIngestion";
import Compliance from "./pages/Compliance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          <ActivityProvider>
            <SimulationProvider>
              <TooltipProvider>
                <IncidentsProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                      <Route path="/incidents" element={<ProtectedRoute><Incidents /></ProtectedRoute>} />
                      <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
                      <Route path="/evidence" element={<ProtectedRoute><Evidence /></ProtectedRoute>} />
                      <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
                      <Route path="/enrichment" element={<ProtectedRoute><Enrichment /></ProtectedRoute>} />
                      <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                      <Route path="/documentation" element={<ProtectedRoute><Documentation /></ProtectedRoute>} />
                      <Route path="/audit-log" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
                      <Route path="/playbooks" element={<ProtectedRoute><Playbooks /></ProtectedRoute>} />
                      <Route path="/mitre" element={<ProtectedRoute><MitreMapping /></ProtectedRoute>} />
                      <Route path="/log-ingestion" element={<ProtectedRoute><LogIngestion /></ProtectedRoute>} />
                      <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </IncidentsProvider>
              </TooltipProvider>
            </SimulationProvider>
          </ActivityProvider>
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;