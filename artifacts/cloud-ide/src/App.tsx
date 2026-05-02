import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import NotFound      from "@/pages/not-found";
import IDE          from "@/pages/IDE";
import SharedProject from "@/pages/SharedProject";
import AuthPage      from "@/pages/AuthPage";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const Explore = lazy(() => import("@/pages/Explore"));

const queryClient = new QueryClient();

const LoadingScreen = (
  <div className="h-screen w-screen flex items-center justify-center bg-background font-mono text-sm text-muted-foreground">
    Loading…
  </div>
);

/** Routes that require authentication show the AuthPage when not logged in */
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return LoadingScreen;
  if (!user)     return <AuthPage />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <ProtectedRoute component={IDE} />
      </Route>
      <Route path="/explore">
        <Suspense fallback={LoadingScreen}>
          <Explore />
        </Suspense>
      </Route>
      <Route path="/p/:shareId" component={SharedProject} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
