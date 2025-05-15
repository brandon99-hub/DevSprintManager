import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import GithubPRs from "@/pages/GithubPRs";
import Team from "@/pages/Team";
import SprintHistory from "@/pages/SprintHistory";
import Settings from "@/pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/github-prs" component={GithubPRs} />
      <Route path="/team" component={Team} />
      <Route path="/sprint-history" component={SprintHistory} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
