import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { ApiError } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Preloader } from "@/components/Preloader";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout/Layout";
import HomePage from "@/pages/HomePage";
import BusinessesPage from "@/pages/BusinessesPage";
import BusinessProfilePage from "@/pages/BusinessProfilePage";
import BusinessStorePage from "@/pages/BusinessStorePage";
import { CartProvider } from "@/components/marketplace/CartContext";
import ExplorePage from "@/pages/ExplorePage";
import AgentsPage from "@/pages/AgentsPage";
import AgentApplyPage from "@/pages/AgentApplyPage";
import AgentDashboardPage from "@/pages/AgentDashboardPage";
import RiderApplyPage from "@/pages/RiderApplyPage";
import RiderDashboardPage from "@/pages/RiderDashboardPage";
import DeliveryTrackingPage from "@/pages/DeliveryTrackingPage";
import OwnerDashboardPage from "@/pages/OwnerDashboardPage";
import BusinessOnboardingPage from "@/pages/BusinessOnboardingPage";
import AdminPage from "@/pages/AdminPage";
import ModeratorDashboardPage from "@/pages/ModeratorDashboardPage";
import ScoutManagerDashboardPage from "@/pages/ScoutManagerDashboardPage";
import RegionalManagerDashboardPage from "@/pages/RegionalManagerDashboardPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AboutPage from "@/pages/AboutPage";
import AccountPage from "@/pages/AccountPage";
import ContactPage from "@/pages/ContactPage";
import SupportTicketsPage from "@/pages/SupportTicketsPage";
import MessagesPage from "@/pages/MessagesPage";
import PropertiesPage from "@/pages/PropertiesPage";
import PropertySubmitPage from "@/pages/PropertySubmitPage";
import ChangePasswordPage from "@/pages/ChangePasswordPage";

function handlePasswordChangeRequired(error: unknown) {
  if (
    error instanceof ApiError &&
    error.status === 403 &&
    (error.data as any)?.code === "PASSWORD_CHANGE_REQUIRED" &&
    window.location.pathname.indexOf("/auth/") === -1 &&
    !window.location.pathname.endsWith("/change-password")
  ) {
    window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/change-password`;
  }
}

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
  queryCache: new QueryCache({ onError: handlePasswordChangeRequired }),
  mutationCache: new MutationCache({ onError: handlePasswordChangeRequired }),
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
      <Route path="/business/onboard" component={BusinessOnboardingPage} />
      <Route path="/owner-dashboard" component={OwnerDashboardPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/moderator" component={ModeratorDashboardPage} />
      <Route path="/scout-manager" component={ScoutManagerDashboardPage} />
      <Route path="/regional-manager" component={RegionalManagerDashboardPage} />
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
      <Route path="/change-password" component={ChangePasswordPage} />
      <Route path="/account">
        {() => localStorage.getItem("streetly_token") ? <AccountPage /> : <LoginPage />}
      </Route>
      <Route path="/about" component={AboutPage} />
      <Route path="/properties" component={PropertiesPage} />
      <Route path="/properties/submit" component={PropertySubmitPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/support" component={SupportTicketsPage} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/:slug/store" component={BusinessStorePage} />
      <Route path="/:slug" component={BusinessProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <Preloader />
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ScrollToTop />
            <Router />
          </WouterRouter>
          <Toaster />
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
