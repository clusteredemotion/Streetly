import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Building2, Users, ShieldCheck, Loader2 } from "lucide-react";
import { getApiBase } from "@/lib/utils";

const BASE = getApiBase();
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

const COLORS = ["#4a9eff", "#7c6ef5", "#34d399", "#fbbf24", "#f87171", "#fb923c", "#e879f9", "#22d3ee"];

function useAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/analytics`, { headers: authHeader() });
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json() as Promise<{
        businessGrowth: Array<{ month: string; count: number; cumulative: number }>;
        categoryBreakdown: Array<{ name: string; count: number }>;
        statusBreakdown: Array<{ status: string; count: number }>;
        cityBreakdown: Array<{ city: string; count: number }>;
        agentGrowth: Array<{ month: string; count: number }>;
        totalBusinesses: number;
        totalUsers: number;
        totalAgents: number;
      }>;
    },
  });
}

const CardStat = ({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) => (
  <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div>
      <p className="text-2xl font-extrabold text-white">{value}</p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
    </div>
  </div>
);

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
    <h3 className="text-sm font-semibold text-white mb-5">{title}</h3>
    {children}
  </div>
);

const tooltipStyle = {
  contentStyle: { background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 12 },
  labelStyle: { color: "rgba(255,255,255,0.6)" },
  itemStyle: { color: "#4a9eff" },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl shadow-xl" style={{ background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.12)" }}>
      <p className="text-xs text-white/50 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AdminAnalytics() {
  const { data, isLoading } = useAnalytics();

  if (isLoading) return (
    <div className="flex items-center justify-center py-24 text-white/30">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-20 text-white/30 text-sm">No analytics data available yet.</div>
  );

  const statusColors: Record<string, string> = {
    approved: "#34d399", pending: "#fbbf24", rejected: "#f87171", suspended: "#94a3b8",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Platform Analytics</h2>
        <p className="text-sm text-white/40">Business growth, demographics, and platform statistics for Streetly</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CardStat label="Total Businesses" value={data.totalBusinesses} icon={<Building2 className="h-5 w-5" />} color="#4a9eff" />
        <CardStat label="Total Users" value={data.totalUsers} icon={<Users className="h-5 w-5" />} color="#7c6ef5" />
        <CardStat label="Field Agents" value={data.totalAgents} icon={<ShieldCheck className="h-5 w-5" />} color="#34d399" />
        <CardStat label="Approved Biz" value={data.statusBreakdown.find(s => s.status === "approved")?.count ?? 0}
          icon={<TrendingUp className="h-5 w-5" />} color="#fbbf24" />
      </div>

      {/* Business Growth Area Chart */}
      <ChartCard title="📈 Business Registration Growth (Last 12 Months)">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data.businessGrowth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4a9eff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4a9eff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c6ef5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c6ef5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }} />
            <Area type="monotone" dataKey="count" name="New Businesses" stroke="#4a9eff" fill="url(#colorNew)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="cumulative" name="Total (Cumulative)" stroke="#7c6ef5" fill="url(#colorCumulative)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Pie */}
        <ChartCard title="🍕 Business Category Breakdown">
          {data.categoryBreakdown.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.categoryBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%"
                  outerRadius={100} innerRadius={50} paddingAngle={2}
                  label={({ name, percent }) => percent > 0.04 ? `${name} ${(percent * 100).toFixed(0)}%` : ""}>
                  {data.categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Status Breakdown Bar */}
        <ChartCard title="📊 Business Status Distribution">
          {data.statusBreakdown.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.statusBreakdown} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="status" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Businesses" radius={[6, 6, 0, 0]}>
                  {data.statusBreakdown.map((entry, i) => (
                    <Cell key={i} fill={statusColors[entry.status] ?? "#4a9eff"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* City Breakdown Bar */}
        <ChartCard title="🌆 Top Cities by Business Count">
          {data.cityBreakdown.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.cityBreakdown} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="city" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Businesses" fill="#4a9eff" radius={[0, 6, 6, 0]}>
                  {data.cityBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Agent Growth */}
        <ChartCard title="🕵️ Agent Registration Growth">
          {data.agentGrowth.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">No agent data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.agentGrowth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAgent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="New Agents" stroke="#34d399" fill="url(#colorAgent)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
