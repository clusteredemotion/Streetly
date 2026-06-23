import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useGetAgentDashboard, useRequestWithdrawal, getGetAgentDashboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import {
  Building2, CheckCircle, Clock, Wallet, TrendingUp,
  ArrowRight, AlertCircle, LogIn
} from "lucide-react";
import { useState } from "react";

// Demo: use agent id 1 for demo purposes
const DEMO_AGENT_ID = 1;

export default function AgentDashboardPage() {
  const [, navigate] = useLocation();
  const token = typeof window !== "undefined" ? localStorage.getItem("streetly_token") : null;
  const qc = useQueryClient();

  const { data: dashData, isLoading } = useGetAgentDashboard(DEMO_AGENT_ID, {
    query: { enabled: true },
  });

  const withdrawMutation = useRequestWithdrawal();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  const agent = dashData?.agent;
  const recentListings = dashData?.recentListings ?? [];
  const recentWithdrawals = dashData?.recentWithdrawals ?? [];

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    await withdrawMutation.mutateAsync({ agentId: DEMO_AGENT_ID, data: { amount: Number(withdrawAmount) } });
    qc.invalidateQueries({ queryKey: getGetAgentDashboardQueryKey(DEMO_AGENT_ID) });
    setWithdrawAmount("");
    setShowWithdrawForm(false);
  };

  const statusColor = (status: string) => {
    if (status === "approved") return "bg-green-100 text-green-700";
    if (status === "rejected") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <Layout>
      <div className="bg-gradient-to-r from-[#0547B6] to-[#1a6de8] text-white py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold">Agent Dashboard</h1>
          {agent && <p className="text-blue-100 mt-1">Welcome back, {agent.userName}</p>}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : agent ? (
          <>
            {/* Status Badge */}
            <div className="mb-6 flex items-center gap-3">
              <Badge className={`${statusColor(agent.status)} text-sm px-3 py-1`}>
                {agent.status === "approved" ? "Active Agent" : agent.status === "pending" ? "Pending Approval" : "Status: " + agent.status}
              </Badge>
              {agent.status === "pending" && (
                <span className="text-sm text-muted-foreground">Your application is under review</span>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Building2, label: "Total Listings", value: agent.totalListings, color: "text-blue-600 bg-blue-50" },
                { icon: CheckCircle, label: "Approved", value: agent.approvedListings, color: "text-green-600 bg-green-50" },
                { icon: TrendingUp, label: "Total Earned", value: formatCurrency(agent.totalEarnings), color: "text-purple-600 bg-purple-50" },
                { icon: Wallet, label: "Available Balance", value: formatCurrency(agent.availableBalance), color: "text-orange-600 bg-orange-50" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card border rounded-xl p-5"
                >
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Withdraw */}
            <div className="bg-card border rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-bold text-foreground">Available Balance: {formatCurrency(agent.availableBalance)}</h3>
                  <p className="text-sm text-muted-foreground">Bank: {agent.bankName} · {agent.accountNumber}</p>
                </div>
                {!showWithdrawForm && (
                  <Button onClick={() => setShowWithdrawForm(true)} disabled={agent.availableBalance <= 0}>
                    Request Withdrawal
                  </Button>
                )}
              </div>
              {showWithdrawForm && (
                <form onSubmit={handleWithdraw} className="mt-4 flex gap-3">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Amount (₦)"
                    min={500}
                    max={agent.availableBalance}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                    required
                  />
                  <Button type="submit" disabled={withdrawMutation.isPending}>
                    {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowWithdrawForm(false)}>Cancel</Button>
                </form>
              )}
            </div>

            {/* Recent Listings */}
            <div className="mb-8">
              <h2 className="font-bold text-lg text-foreground mb-4">Recent Listings</h2>
              {recentListings.length === 0 ? (
                <div className="text-center py-8 border rounded-xl text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  No listings yet. Start adding businesses!
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left p-3 font-medium text-muted-foreground">Business Name</th>
                        <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Status</th>
                        <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Added</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentListings.map((biz) => (
                        <tr key={biz.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3 font-medium text-foreground">{biz.name}</td>
                          <td className="p-3 hidden md:table-cell">
                            <Badge className={statusColor(biz.status)} variant="secondary">{biz.status}</Badge>
                          </td>
                          <td className="p-3 text-muted-foreground hidden md:table-cell">
                            {new Date(biz.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Withdrawals */}
            {recentWithdrawals.length > 0 && (
              <div>
                <h2 className="font-bold text-lg text-foreground mb-4">Withdrawal History</h2>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentWithdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-muted/10">
                          <td className="p-3 font-bold text-foreground">{formatCurrency(w.amount)}</td>
                          <td className="p-3">
                            <Badge className={statusColor(w.status)} variant="secondary">{w.status}</Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted" />
            <h2 className="text-xl font-bold mb-2">Agent data not found</h2>
            <p className="text-muted-foreground mb-4">Please apply as an agent first</p>
            <Button onClick={() => navigate("/agents/apply")}>Apply as Agent</Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
