import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetAdminStats,
  useGetPendingBusinesses,
  useGetPendingAgents,
  useApproveBusiness,
  useApproveAgent,
  getGetPendingBusinessesQueryKey,
  getGetPendingAgentsQueryKey,
  getGetAdminStatsQueryKey,
} from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Building2, Users, TrendingUp, AlertCircle, CheckCircle, XCircle, ShieldCheck, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import AddBusinessForm from "@/components/admin/AddBusinessForm";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

function usePendingClaims() {
  return useQuery({
    queryKey: ["admin", "claims", "pending"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/claims/pending`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}` },
      });
      return res.json() as Promise<Array<{
        id: number; businessId: number; businessName: string; userId: number;
        claimerName: string; claimerEmail: string; claimerPhone: string | null;
        proofNote: string | null; status: string; createdAt: string;
      }>>;
    },
  });
}

function useApproveClaim() {
  return useMutation({
    mutationFn: async ({ id, approved, adminNote }: { id: number; approved: boolean; adminNote?: string }) => {
      const res = await fetch(`${BASE}/api/admin/claims/${id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
        },
        body: JSON.stringify({ approved, adminNote }),
      });
      return res.json();
    },
  });
}

export default function AdminPage() {
  const qc = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: pendingBiz } = useGetPendingBusinesses();
  const { data: pendingAgents } = useGetPendingAgents();
  const { data: pendingClaims } = usePendingClaims();

  const approveBiz = useApproveBusiness();
  const approveAgent = useApproveAgent();
  const approveClaim = useApproveClaim();

  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});

  const handleBizApproval = async (id: number, approved: boolean) => {
    await approveBiz.mutateAsync({ id, data: { approved } });
    qc.invalidateQueries({ queryKey: getGetPendingBusinessesQueryKey() });
    qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  };

  const handleAgentApproval = async (id: number, approved: boolean) => {
    await approveAgent.mutateAsync({ id, data: { approved } });
    qc.invalidateQueries({ queryKey: getGetPendingAgentsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  };

  const handleClaimApproval = async (id: number, approved: boolean) => {
    await approveClaim.mutateAsync({ id, approved, adminNote: adminNotes[id] });
    qc.invalidateQueries({ queryKey: ["admin", "claims", "pending"] });
  };

  const totalPending = (stats?.pendingBusinesses ?? 0) + (stats?.pendingAgents ?? 0) + (pendingClaims?.length ?? 0);

  return (
    <Layout>
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage the Streetly platform</p>
          {totalPending > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 text-orange-300 text-sm px-3 py-1.5 rounded-full">
              <AlertCircle className="h-4 w-4" />
              {totalPending} item{totalPending !== 1 ? "s" : ""} awaiting review
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Businesses", value: stats.totalBusinesses, icon: Building2, color: "text-blue-600 bg-blue-50" },
              { label: "Agents", value: stats.totalAgents, icon: Users, color: "text-green-600 bg-green-50" },
              { label: "Users", value: stats.totalUsers, icon: Users, color: "text-purple-600 bg-purple-50" },
              { label: "Pending Biz", value: stats.pendingBusinesses, icon: AlertCircle, color: "text-orange-600 bg-orange-50" },
              { label: "Revenue", value: formatCurrency(stats.revenue), icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-card border rounded-xl p-4"
              >
                <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="text-xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="add-business">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="add-business" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              Add Business
            </TabsTrigger>
            <TabsTrigger value="businesses" className="gap-2">
              Pending Businesses
              {(stats?.pendingBusinesses ?? 0) > 0 && (
                <Badge className="bg-orange-500 text-white hover:bg-orange-500 h-5 min-w-5 px-1.5 text-xs">
                  {stats?.pendingBusinesses}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2">
              Pending Agents
              {(stats?.pendingAgents ?? 0) > 0 && (
                <Badge className="bg-orange-500 text-white hover:bg-orange-500 h-5 min-w-5 px-1.5 text-xs">
                  {stats?.pendingAgents}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="claims" className="gap-2">
              Ownership Claims
              {(pendingClaims?.length ?? 0) > 0 && (
                <Badge className="bg-orange-500 text-white hover:bg-orange-500 h-5 min-w-5 px-1.5 text-xs">
                  {pendingClaims?.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Add Business */}
          <TabsContent value="add-business">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-foreground">Add New Business</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Register a business directly to the Streetly directory. Pin its location on the map, upload photos, and publish immediately.
                </p>
              </div>
              <AddBusinessForm />
            </div>
          </TabsContent>

          {/* Pending Businesses */}
          <TabsContent value="businesses">
            {!pendingBiz?.length ? (
              <div className="text-center py-16 border rounded-xl">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500" />
                <h3 className="font-semibold text-foreground">No pending businesses</h3>
                <p className="text-sm text-muted-foreground mt-1">All businesses have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingBiz.map((biz) => (
                  <div key={biz.id} className="flex items-center gap-4 p-4 bg-card border rounded-xl">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{biz.name}</h3>
                      <p className="text-sm text-muted-foreground">Category ID: {biz.categoryId} · Street ID: {biz.streetId}</p>
                      {biz.phone && <p className="text-xs text-muted-foreground">Phone: {biz.phone}</p>}
                      <p className="text-xs text-muted-foreground">Added: {new Date(biz.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1"
                        onClick={() => handleBizApproval(biz.id, true)} disabled={approveBiz.isPending}>
                        <CheckCircle className="h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                        onClick={() => handleBizApproval(biz.id, false)} disabled={approveBiz.isPending}>
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pending Agents */}
          <TabsContent value="agents">
            {!pendingAgents?.length ? (
              <div className="text-center py-16 border rounded-xl">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500" />
                <h3 className="font-semibold text-foreground">No pending agents</h3>
                <p className="text-sm text-muted-foreground mt-1">All applications have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center gap-4 p-4 bg-card border rounded-xl">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">Agent #{agent.id}</h3>
                      <p className="text-sm text-muted-foreground">Bank: {agent.bankName} · {agent.accountNumber}</p>
                      <p className="text-xs text-muted-foreground">ID: {agent.idType?.toUpperCase()} — {agent.idNumber}</p>
                      <p className="text-xs text-muted-foreground">Applied: {new Date(agent.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1"
                        onClick={() => handleAgentApproval(agent.id, true)} disabled={approveAgent.isPending}>
                        <CheckCircle className="h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                        onClick={() => handleAgentApproval(agent.id, false)} disabled={approveAgent.isPending}>
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Ownership Claims */}
          <TabsContent value="claims">
            {!pendingClaims?.length ? (
              <div className="text-center py-16 border rounded-xl">
                <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-green-500" />
                <h3 className="font-semibold text-foreground">No pending claims</h3>
                <p className="text-sm text-muted-foreground mt-1">All ownership claims have been resolved</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingClaims.map((claim) => (
                  <div key={claim.id} className="p-5 bg-card border rounded-xl">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold text-foreground">{claim.businessName}</h3>
                          <Badge variant="secondary" className="text-xs">Claim #{claim.id}</Badge>
                        </div>
                        <p className="text-sm font-medium text-foreground">{claim.claimerName}</p>
                        <p className="text-sm text-muted-foreground">{claim.claimerEmail}</p>
                        {claim.claimerPhone && <p className="text-sm text-muted-foreground">{claim.claimerPhone}</p>}
                        <p className="text-xs text-muted-foreground mt-1">Submitted: {new Date(claim.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {claim.proofNote && (
                      <div className="bg-muted/40 rounded-lg p-3 text-sm text-foreground mb-4">
                        <span className="text-xs text-muted-foreground block mb-1 font-medium">Verification Note:</span>
                        {claim.proofNote}
                      </div>
                    )}

                    <div className="space-y-3">
                      <Textarea
                        placeholder="Add a note to the claimant (optional)..."
                        value={adminNotes[claim.id] ?? ""}
                        onChange={(e) => setAdminNotes(prev => ({ ...prev, [claim.id]: e.target.value }))}
                        rows={2}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1 flex-1"
                          onClick={() => handleClaimApproval(claim.id, true)} disabled={approveClaim.isPending}>
                          <CheckCircle className="h-4 w-4" /> Approve & Transfer Ownership
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1 flex-1"
                          onClick={() => handleClaimApproval(claim.id, false)} disabled={approveClaim.isPending}>
                          <XCircle className="h-4 w-4" /> Reject Claim
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
