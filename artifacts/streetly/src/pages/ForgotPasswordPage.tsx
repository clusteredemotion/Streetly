import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForgotPassword } from "@workspace/api-client-react";
import { KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const forgotPasswordMutation = useForgotPassword();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await forgotPasswordMutation.mutateAsync({ data: { email } });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.data?.error ?? "Something went wrong. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center bg-muted/20 py-12 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 text-primary font-bold text-2xl mb-2">
              <KeyRound className="h-7 w-7" />
              Streetly
            </div>
            <h1 className="text-xl font-bold text-foreground">Forgot your password?</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Enter your email and we'll send you a link to reset it.
            </p>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            {submitted ? (
              <div className="text-sm text-center text-foreground space-y-3">
                <p>If an account exists for <span className="font-medium">{email}</span>, we've sent a password reset link to that email.</p>
                <p className="text-muted-foreground">Check your inbox (and spam folder) for the link.</p>
              </div>
            ) : (
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
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
                )}
                <Button type="submit" className="w-full" disabled={forgotPasswordMutation.isPending}>
                  {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Remembered your password?{" "}
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
