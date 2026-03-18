import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider, useAuth } from "@/hooks/use-auth";

import BootScreen from "@/pages/boot";
import AuthScreen from "@/pages/auth";
import DashboardLayout from "@/pages/dashboard/layout";
import ChatTab from "@/pages/dashboard/chat";
import MemoryTab from "@/pages/dashboard/memory";
import SessionsTab from "@/pages/dashboard/sessions";
import StatusTab from "@/pages/dashboard/status";
import DownloadPage from "@/pages/download";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-primary font-mono text-xl animate-pulse glow-text">
        VERIFYING CREDENTIALS...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/auth" />;
  }

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={BootScreen} />
      <Route path="/auth" component={AuthScreen} />
      <Route path="/download" component={DownloadPage} />

      <Route path="/dashboard">
        {() => <ProtectedRoute component={ChatTab} />}
      </Route>
      <Route path="/dashboard/memory">
        {() => <ProtectedRoute component={MemoryTab} />}
      </Route>
      <Route path="/dashboard/sessions">
        {() => <ProtectedRoute component={SessionsTab} />}
      </Route>
      <Route path="/dashboard/status">
        {() => <ProtectedRoute component={StatusTab} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
