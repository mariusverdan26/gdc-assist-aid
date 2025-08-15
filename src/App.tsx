import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/app-layout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { UserProvider } from "./contexts/UserContext";
import Dashboard from "./pages/admin/Dashboard";
import UsersScreen from "./pages/admin/Users";
import TicketsList from "./pages/admin/TicketsList";
import NewTicket from "./pages/employee/NewTicket";
import MyTickets from "./pages/employee/MyTickets";
import AppLandingRedirect from "./pages/AppLandingRedirect";
import TicketDetails from "./pages/tickets/TicketDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Test from "./pages/Test";
import TestAuth from "./pages/TestAuth";
import { TestCredentials } from "./components/auth/TestCredentials";

const queryClient = new QueryClient();

const App = () => {
  console.log('App component rendering');
  
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/test" element={<Test />} />
              <Route path="/test-auth" element={<TestAuth />} />
              <Route path="/test-credentials" element={<TestCredentials />} />
              <Route path="/" element={<Index />} />
              <Route path="/login" element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              } />
              <Route path="/register" element={
                <ProtectedRoute requireAuth={false}>
                  <Register />
                </ProtectedRoute>
              } />
              <Route path="/app" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AppLandingRedirect />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="tickets/:status" element={<TicketsList />} />
                <Route path="tickets/view/:id" element={<TicketDetails />} />
                <Route path="tickets" element={<Navigate to="/app/tickets/all" replace />} />
                <Route path="new-ticket" element={<NewTicket />} />
                <Route path="my-tickets" element={<MyTickets />} />
                <Route path="reports" element={<Dashboard />} />
                <Route path="users" element={<UsersScreen />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
};

export default App;
