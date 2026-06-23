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
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Building2, Users, TrendingUp, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function AdminPage() {
  const qc = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: pendingBiz } = useGetPendingBusinesses();
  const { data: pendingAgents } = useGetPendingAgents();

  const approveBiz = useApproveBusiness();
  const approveAgent = useApproveAgent();

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

  return (
    <Layout>
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage the Streetly platform</p>
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
        <Tabs defaultValue="businesses">
          <TabsList className="mb-6">
            <TabsTrigger value="businesses">
              Pending Businesses
              {stats?.pendingBusinesses ? (
                <Badge className="ml-2 bg-orange-500 text-white hover:bg-orange-500 h-5 min-w-5 px-1.5 text-xs">
                  {stats.pendingBusinesses}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="agents">
              Pending Agents
              {stats?.pendingAgents ? (
                <Badge className="ml-2 bg-orange-500 text-white hover:bg-orange-500 h-5 min-w-5 px-1.5 text-xs">
                  {stats.pendingAgents}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

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
                      <p className="text-sm text-muted-foreground">
                        Category ID: {biz.categoryId} · Street ID: {biz.streetId}
                      </p>
                      {biz.phone && <p className="text-xs text-muted-foreground">Phone: {biz.phone}</p>}
                      <p className="text-xs text-muted-foreground">Added: {new Date(biz.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white gap-1"
                        onClick={() => handleBizApproval(biz.id, true)}
                        disabled={approveBiz.isPending}
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                        onClick={() => handleBizApproval(biz.id, false)}
                        disabled={approveBiz.isPending}
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

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
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white gap-1"
                        onClick={() => handleAgentApproval(agent.id, true)}
                        disabled={approveAgent.isPending}
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                        onClick={() => handleAgentApproval(agent.id, false)}
                        disabled={approveAgent.isPending}
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
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
