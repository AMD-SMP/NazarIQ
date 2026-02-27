import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { FilterProvider } from "@/context/FilterContext";
import { Navbar } from "@/components/layout/Navbar";
import PublicDashboard from "@/pages/PublicDashboard";
import IncidentDetail from "@/pages/IncidentDetail";
import TrendsPage from "@/pages/TrendsPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import IncidentManagement from "@/pages/admin/IncidentManagement";
import NotFound from "@/pages/NotFound";
import { AdminRoute } from "@/routes/AdminRoute";

const queryClient = new QueryClient();

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <MainLayout />;
}

function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="min-h-[calc(100vh-3rem)]">
        <Outlet />
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<PublicDashboard />} />
        <Route path="/incident/:id" element={<IncidentDetail />} />
        <Route path="/trends" element={<TrendsPage />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/incidents" element={<AdminRoute><IncidentManagement /></AdminRoute>} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/login" element={<LoginGate />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function LoginGate() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <LoginPage />;
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
              <AppRoutes />
            </FilterProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
