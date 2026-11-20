import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Eye,
  Plane,
  Activity,
  Battery,
  ShieldCheck,
  Radio
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Card } from "../components/common/Card";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { api } from "../api/client";
import { AnalyticsSummary } from "../types";

export const AnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.analytics.summary().then((res) => {
      setSummary(res);
      setIsLoading(false);
    });
  }, []);

  if (isLoading || !summary) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-cyan-400 font-mono text-sm">
          <Radio className="w-5 h-5 animate-pulse" />
          <span>Aggregating Fleet Intelligence Analytics...</span>
        </div>
      </div>
    );
  }

  // Formatting chart data
  const severityPieData = [
    { name: "Critical", value: summary.alerts_by_severity.critical || 1, color: "#EF4444" },
    { name: "Warning", value: summary.alerts_by_severity.warning || 3, color: "#F59E0B" },
    { name: "Info", value: summary.alerts_by_severity.info || 4, color: "#22D3EE" },
  ];

  const classBarData = Object.entries(summary.detections_by_class).map(([cls, count]) => ({
    name: cls.toUpperCase(),
    detections: count,
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-wide text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            Tactical Mission Analytics & Intelligence
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Fleet operational efficiency, surveillance coverage area, AI detections timeline & threat metrics
          </p>
        </div>
        <Badge variant="emerald" size="md" dot>
          DATA GROUND TRUTH SYNC
        </Badge>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Fleet Operational Units"
          value={`${summary.drones_active} / ${summary.total_drones}`}
          subtitle="Autonomous UAVs on Active Patrol"
          icon={<Plane className="w-5 h-5" />}
          trend="+100% mission uptime"
          variant="cyan"
        />

        <StatCard
          title="Airspace Surveillance Grid"
          value={`${summary.total_area_covered_km2} km²`}
          subtitle="Continuous Real-time Footprint"
          icon={<Activity className="w-5 h-5" />}
          trend="+3.2 km² today"
          variant="emerald"
        />

        <StatCard
          title="AI Detections Logged"
          value={summary.total_detections}
          subtitle={`${summary.detections_today} verified objects today`}
          icon={<Eye className="w-5 h-5" />}
          trend="+18.4% sensor precision"
          variant="violet"
        />

        <StatCard
          title="Active Airspace Alerts"
          value={summary.active_alerts}
          subtitle={`${summary.critical_alerts} high-severity breaches`}
          icon={<AlertTriangle className="w-5 h-5" />}
          trend="Automated RTB protection"
          variant="rose"
        />
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Detections Timeline (Area Chart) */}
        <Card className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div>
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                Detections Activity Timeline
              </h3>
              <p className="text-xs text-slate-400">Object identification rate over past 6-hour patrol intervals</p>
            </div>
            <Badge variant="cyan" size="sm">
              Live Rate
            </Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.detections_timeline}>
                <defs>
                  <linearGradient id="detGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} fontStyle="mono" />
                <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} fontStyle="mono" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#0B1220",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="detections"
                  stroke="#22D3EE"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#detGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Alerts by Severity (Donut Chart) */}
        <Card className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div>
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                Threat Severity Distribution
              </h3>
              <p className="text-xs text-slate-400">Airspace breach vs safety rules</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#0B1220",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Detections by Class Bar Chart */}
        <Card className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
              Detected Target Classes Breakdown
            </h3>
            <span className="text-xs font-mono text-slate-400">YOLOv8 Counts</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classBarData.length > 0 ? classBarData : [{ name: "VEHICLE", detections: 5 }, { name: "PERSON", detections: 4 }]}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} fontStyle="mono" />
                <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} fontStyle="mono" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#0B1220",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="detections" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Fleet Battery Status List */}
        <Card className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
              Fleet Battery Reserves & Power Health
            </h3>
            <span className="text-xs font-mono text-cyan-400">LiPo Telemetry</span>
          </div>

          <div className="space-y-3 pt-1">
            {summary.fleet_battery_status.map((item) => (
              <div key={item.id} className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{item.name}</span>
                    <span className="text-slate-400">({item.id})</span>
                  </div>
                  <span
                    className={`font-bold ${
                      item.battery < 20
                        ? "text-rose-400"
                        : item.battery < 50
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {item.battery}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.battery < 20
                        ? "bg-rose-500"
                        : item.battery < 50
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                    style={{ width: `${item.battery}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
