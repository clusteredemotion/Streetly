import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { MapPin, User, Building2, MapPin as AgentIcon, Info } from "lucide-react";
import { cn, formatCurrencyWithConversion } from "@/lib/utils";
import { BUSINESS_REGISTRATION_FEE } from "@/lib/constants";
import { useVisitorGeo } from "@/hooks/useVisitorGeo";

const ROLES = [
  { value: "visitor", label: "Customer / Visitor", desc: "Discover and contact local businesses", icon: User },
  { value: "business_owner", label: "Business Owner", desc: "List and manage your business", icon: Building2 },
  { value: "field_agent", label: "Field Agent", desc: "Register businesses and earn commissions", icon: AgentIcon },
];

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const registerMutation = useRegister();
  const { geo } = useVisitorGeo();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("visitor");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const result = await registerMutation.mutateAsync({ data: { name, email, password, role } });
      localStorage.setItem("streetly_token", result.token);
      setAuthTokenGetter(() => localStorage.getItem("streetly_token"));
      if (role === "field_agent") navigate("/agents/apply");
      else if (role === "business_owner") navigate("/owner-dashboard");
      else navigate("/");
    } catch (err: any) {
      setError(err?.data?.error ?? "Registration failed. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center bg-muted/20 py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 text-primary font-bold text-2xl mb-2">
              <MapPin className="h-7 w-7" />
              Streetly
            </div>
            <h1 className="text-xl font-bold text-foreground">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-1">Join the world's street-by-street business discovery platform</p>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection */}
              <div>
                <Label className="mb-3 block">I am joining as...</Label>
                <div className="grid grid-cols-1 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                        role === r.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/40 hover:bg-muted/30"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                        role === r.value ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      )}>
                        <r.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-foreground">{r.label}</div>
                        <div className="text-xs text-muted-foreground">{r.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {role === "business_owner" && (
                <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/20 rounded-xl px-3.5 py-3 text-sm text-foreground/90">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                  <span>
                    A one-time registration fee of{" "}
                    <span className="font-semibold">{formatCurrencyWithConversion(BUSINESS_REGISTRATION_FEE, geo)}</span>{" "}
                    applies to list your business. Payment collection is coming soon — for now, you can create your account and set up your listing.
                  </span>
                </div>
              )}

              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="mt-1.5"
                />
              </div>
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
                  placeholder="Create a strong password"
                  minLength={6}
                  required
                  className="mt-1.5"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
