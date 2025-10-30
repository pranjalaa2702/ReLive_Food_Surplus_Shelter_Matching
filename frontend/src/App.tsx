import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Requests from "./pages/Requests";
import Volunteer from "./pages/Volunteer";
import Shelters from "./pages/Shelters";
import Auth from "./pages/Auth";
import AdminPanel from "./pages/AdminPanel";
import DonorDashboard from "./pages/DonorDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import ShelterDashboard from "./pages/ShelterDashboard";
import NotFound from "./pages/NotFound";
import FulfillRequest from "./pages/FulfillRequest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/requests/:id/fulfill" element={<ProtectedRoute unauthenticatedRedirectTo="/auth"><FulfillRequest /></ProtectedRoute>} />
            <Route path="/volunteer" element={<Volunteer />} />
            <Route path="/shelters" element={<Shelters />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Role-specific protected routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/donor-dashboard" 
              element={
                <ProtectedRoute requiredRole="donor">
                  <DonorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/volunteer-dashboard" 
              element={
                <ProtectedRoute requiredRole="volunteer">
                  <VolunteerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/shelter-dashboard" 
              element={
                <ProtectedRoute requiredRole="shelter">
                  <ShelterDashboard />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
