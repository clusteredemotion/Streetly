import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSetupPassword } from "@workspace/api-client-react";
import { KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const resetPasswordMutation = useSetupPassword();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("This reset link is missing its token. Please use the link from your email.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const result = await resetPasswordMutation.mutateAsync({ data: { token, newPassword } });
      if (result.token) {
        localStorage.setItem("streetly_token", result.token);
      }
      setSuccess(true);
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      setError(err?.data?.error ?? "Could not reset your password. The link may be invalid or expired.");
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
            <h1 className="text-xl font-bold text-foreground">Reset your password</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Choose a new password for your Streetly account.
            </p>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            {success ? (
              <div className="text-sm text-center text-foreground">
                Password reset! Redirecting you now…
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="mt-1.5"
                  />
                </div>
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
                )}
                <Button type="submit" className="w-full" disabled={resetPasswordMutation.isPending}>
                  {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
