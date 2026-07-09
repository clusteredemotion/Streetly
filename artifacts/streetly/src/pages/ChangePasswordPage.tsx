import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword, setAuthTokenGetter } from "@workspace/api-client-react";
import { KeyRound } from "lucide-react";

export default function ChangePasswordPage() {
  const [, navigate] = useLocation();
  const changePasswordMutation = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const hasToken = !!localStorage.getItem("streetly_token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({ data: { currentPassword, newPassword } });
      setAuthTokenGetter(() => localStorage.getItem("streetly_token"));
      navigate("/");
    } catch (err: any) {
      setError(err?.data?.error ?? "Could not change password");
    }
  };

  if (!hasToken) {
    navigate("/auth/login");
    return null;
  }

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center bg-muted/20 py-12 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 text-primary font-bold text-2xl mb-2">
              <KeyRound className="h-7 w-7" />
              Change Password
            </div>
            <h1 className="text-xl font-bold text-foreground">Set a new password</h1>
            <p className="text-muted-foreground text-sm mt-1">
              For security, you must change your temporary password before continuing.
            </p>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>
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
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
              <Button type="submit" className="w-full" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
