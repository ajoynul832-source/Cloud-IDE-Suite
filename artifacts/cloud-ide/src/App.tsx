import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import IDE from "@/pages/IDE";
import SharedProject from "@/pages/SharedProject";
import Explore from "@/pages/Explore";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={IDE} />
      <Route path="/explore" component={Explore} />
      <Route path="/p/:shareId" component={SharedProject} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
