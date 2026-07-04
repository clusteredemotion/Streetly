import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Preloader } from "@/components/Preloader";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout/Layout";
import HomePage from "@/pages/HomePage";
import BusinessesPage from "@/pages/BusinessesPage";
import BusinessProfilePage from "@/pages/BusinessProfilePage";
import ExplorePage from "@/pages/ExplorePage";
import AgentsPage from "@/pages/AgentsPage";
import AgentApplyPage from "@/pages/AgentApplyPage";
import AgentDashboardPage from "@/pages/AgentDashboardPage";
import RiderApplyPage from "@/pages/RiderApplyPage";
import RiderDashboardPage from "@/pages/RiderDashboardPage";
import DeliveryTrackingPage from "@/pages/DeliveryTrackingPage";
import OwnerDashboardPage from "@/pages/OwnerDashboardPage";
import AdminPage from "@/pages/AdminPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import SupportTicketsPage from "@/pages/SupportTicketsPage";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return null;
}

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
      <Route path="/explore" component={ExplorePage} />
      <Route path="/agents" component={AgentsPage} />
      <Route path="/agents/apply" component={AgentApplyPage} />
      <Route path="/agent-dashboard" component={AgentDashboardPage} />
      <Route path="/riders/apply" component={RiderApplyPage} />
      <Route path="/rider-dashboard" component={RiderDashboardPage} />
      <Route path="/deliveries/:id" component={DeliveryTrackingPage} />
      <Route path="/owner-dashboard" component={OwnerDashboardPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/support" component={SupportTicketsPage} />
      <Route path="/:slug" component={BusinessProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Preloader />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ScrollToTop />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
