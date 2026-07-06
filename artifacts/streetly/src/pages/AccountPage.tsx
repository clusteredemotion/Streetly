import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Copy, Gift, Users, History, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

interface ReferralHistory {
  id: number;
  pointsAwarded: number;
  reason: string;
  createdAt: string;
  refereeName: string;
  refereeEmail: string;
}

interface ReferralData {
  referralCode: string;
  creditPoints: number;
  totalReferrals: number;
  history: ReferralHistory[];
}

export default function AccountPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch(`${BASE}/api/users/me/referrals`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((err) => {
        console.error("Failed to fetch referral data:", err);
        toast({
          title: "Error",
          description: "Failed to load account data. Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const referralLink = data
    ? `${window.location.origin}${BASE}/auth/register?ref=${data.referralCode}`
    : "";

  const copyToClipboard = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-r from-[#0547B6] to-[#1a6de8] text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-blue-100 mt-2">Manage your points and referrals</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-1"
          >
            <Card className="h-full border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  Credit Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-extrabold text-primary">
                  {data?.creditPoints ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Available balance</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2"
          >
            <Card className="h-full border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Refer & Earn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Share your link and earn <span className="font-bold text-blue-600">100 points</span> for every person who registers!
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-background border rounded-lg px-3 py-2 text-sm font-mono truncate select-all">
                    {referralLink}
                  </div>
                  <Button 
                    onClick={copyToClipboard} 
                    className="shrink-0 gap-2"
                    variant={copied ? "outline" : "default"}
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Referral History
            </h2>
            <div className="text-sm text-muted-foreground">
              Total Referrals: <span className="font-bold text-foreground">{data?.totalReferrals ?? 0}</span>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {!data?.history || data.history.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted/30" />
                  <p className="text-muted-foreground">You haven't referred anyone yet.</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Share your link to start earning points!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-4 font-medium">User</th>
                        <th className="text-left p-4 font-medium">Points</th>
                        <th className="text-left p-4 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.history.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-muted/10 transition-colors">
                          <td className="p-4">
                            <div className="font-medium">{item.refereeName}</div>
                            <div className="text-xs text-muted-foreground">{item.refereeEmail}</div>
                          </td>
                          <td className="p-4 font-bold text-green-600">
                            +{item.pointsAwarded}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
