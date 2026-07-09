import { useCallback, useState } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, useGoogleAuth } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { MapPin } from "lucide-react";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

function navigateForRole(role: string, navigate: (path: string) => void) {
  if (role === "field_agent") navigate("/agent-dashboard");
  else if (role === "business_owner") navigate("/owner-dashboard");
  else if (role === "admin") navigate("/admin");
  else if (role === "moderator") navigate("/moderator");
  else if (role === "scout_manager") navigate("/scout-manager");
  else if (role === "regional_manager") navigate("/regional-manager");
  else navigate("/");
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const loginMutation = useLogin();
  const googleAuthMutation = useGoogleAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const result = await loginMutation.mutateAsync({ data: { email, password } });
      localStorage.setItem("streetly_token", result.token);
      setAuthTokenGetter(() => localStorage.getItem("streetly_token"));
      if (result.user.mustChangePassword) {
        navigate("/change-password");
        return;
      }
      navigateForRole(result.user.role, navigate);
    } catch (err: any) {
      setError(err?.data?.error ?? "Invalid email or password");
    }
  };

  const handleGoogleCredential = useCallback(async (idToken: string) => {
    setError("");
    try {
      const result = await googleAuthMutation.mutateAsync({ data: { idToken } as any });
      localStorage.setItem("streetly_token", result.token);
      setAuthTokenGetter(() => localStorage.getItem("streetly_token"));
      if (result.user.mustChangePassword) {
        navigate("/change-password");
        return;
      }
      navigateForRole(result.user.role, navigate);
    } catch (err: any) {
      setError(err?.data?.error ?? "Google sign-in failed. Please try again.");
    }
  }, [navigate, googleAuthMutation]);

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center bg-muted/20 py-12 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 text-primary font-bold text-2xl mb-2">
              <MapPin className="h-7 w-7" />
              Streetly
            </div>
            <h1 className="text-xl font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your Streetly account</p>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="mt-1.5"
                />
              </div>
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <GoogleAuthButton onCredential={handleGoogleCredential} text="signin_with" />

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-primary font-medium hover:underline">
                Create one
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to our{" "}
            <a href="#" className="underline">Terms of Service</a> and{" "}
            <a href="#" className="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </Layout>
  );
}
