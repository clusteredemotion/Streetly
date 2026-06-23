import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout/Layout";
import HomePage from "@/pages/HomePage";
import BusinessesPage from "@/pages/BusinessesPage";
import BusinessProfilePage from "@/pages/BusinessProfilePage";
import ExplorePage from "@/pages/ExplorePage";
import AgentsPage from "@/pages/AgentsPage";
import AgentApplyPage from "@/pages/AgentApplyPage";
import AgentDashboardPage from "@/pages/AgentDashboardPage";
import OwnerDashboardPage from "@/pages/OwnerDashboardPage";
import AdminPage from "@/pages/AdminPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/businesses" component={BusinessesPage} />
      <Route path="/businesses/:id" component={BusinessProfilePage} />
      <Route path="/explore" component={ExplorePage} />
      <Route path="/agents" component={AgentsPage} />
      <Route path="/agents/apply" component={AgentApplyPage} />
      <Route path="/agent-dashboard" component={AgentDashboardPage} />
      <Route path="/owner-dashboard" component={OwnerDashboardPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
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
