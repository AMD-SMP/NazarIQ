import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { FilterProvider } from "@/context/FilterContext";
import { Navbar } from "@/components/layout/Navbar";
import PublicDashboard from "@/pages/PublicDashboard";
import IncidentDetail from "@/pages/IncidentDetail";
import TrendsPage from "@/pages/TrendsPage";
import LoginPage from "@/pages/LoginPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import IncidentManagement from "@/pages/admin/IncidentManagement";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Routes>
        <Route path="/" element={<PublicDashboard />} />
        <Route path="/incident/:id" element={<IncidentDetail />} />
        <Route path="/trends" element={<TrendsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/incidents" element={<AdminRoute><IncidentManagement /></AdminRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <FilterProvider>
              <Toaster />
              <Sonner />
              <AppLayout />
            </FilterProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
