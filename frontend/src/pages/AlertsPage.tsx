import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Download,
  CheckCircle2,
  Filter,
  Search,
  MapPin,
  Clock,
  ShieldAlert,
  FileSpreadsheet,
  Globe
} from "lucide-react";
import { useFleetStore } from "../store/fleetStore";
import { DataTable, Column } from "../components/common/DataTable";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { api } from "../api/client";
import { Alert } from "../types";

export const AlertsPage: React.FC = () => {
  const alerts = useFleetStore((s) => s.alerts);
  const acknowledgeAlert = useFleetStore((s) => s.acknowledgeAlert);
  const resolveAlert = useFleetStore((s) => s.resolveAlert);
  const flyTo = useFleetStore((s) => s.flyTo);
  const navigate = useNavigate();

  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [droneFilter, setDroneFilter] = useState<string>("all");

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (droneFilter !== "all" && a.drone_id !== droneFilter) return false;
    return true;
  });

  const handleAcknowledge = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.alerts.acknowledge(id);
      acknowledgeAlert(id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResolve = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.alerts.resolve(id);
      resolveAlert(id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRowClick = (alert: Alert) => {
    if (alert.latitude && alert.longitude) {
      flyTo(alert.latitude, alert.longitude, 16);
      navigate("/");
    }
  };

  const columns: Column<Alert>[] = [
    {
      header: "Severity",
      accessorKey: "severity",
      sortable: true,
      cell: (row) => (
        <Badge
          variant={
            row.severity === "critical"
              ? "rose"
              : row.severity === "warning"
              ? "amber"
              : "cyan"
          }
          size="sm"
          dot={row.status === "active"}
        >
          {row.severity}
        </Badge>
      ),
    },
    {
      header: "Unit / Drone",
      accessorKey: "drone_id",
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-cyan-300">
          {row.drone_id || "PERIMETER"}
        </span>
      ),
    },
    {
      header: "Type",
      accessorKey: "alert_type",
      sortable: true,
      cell: (row) => (
        <span className="font-mono uppercase text-xs text-slate-300">
          {row.alert_type.replace("_", " ")}
        </span>
      ),
    },
    {
      header: "Incident Message",
      accessorKey: "message",
      cell: (row) => (
        <div className="max-w-md">
          <p className="text-white text-xs leading-relaxed">{row.message}</p>
          {row.latitude && row.longitude && (
            <span className="text-[10px] text-cyan-400 font-mono mt-0.5 block hover:underline">
              GPS: {row.latitude.toFixed(4)}, {row.longitude.toFixed(4)} &bull; View on Map &rarr;
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Timestamp",
      accessorKey: "created_at",
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-xs text-slate-400">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (row) => (
        <Badge
          variant={
            row.status === "active"
              ? "rose"
              : row.status === "acknowledged"
              ? "amber"
              : "emerald"
          }
          size="sm"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {row.status === "active" && (
            <button
              onClick={(e) => handleAcknowledge(row.id, e)}
              className="px-2 py-1 text-[11px] rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors font-mono"
            >
              ACK
            </button>
          )}
          {row.status !== "resolved" && (
            <button
              onClick={(e) => handleResolve(row.id, e)}
              className="px-2 py-1 text-[11px] rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors font-mono"
            >
              Resolve
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-wide text-white flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            Tactical Incidents & Security Alerts
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time rule engine breaches, low battery events, RF blackouts & incident management
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <a
            href={api.export.incidentsUrl("csv")}
            download
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 font-mono transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </a>

          <a
            href={api.export.incidentsUrl("geojson")}
            download
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 font-mono transition-colors"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Export GeoJSON</span>
          </a>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="flex flex-wrap items-center gap-4 py-3">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span>FILTERS:</span>
        </div>

        {/* Severity */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-200 font-mono focus:border-cyan-500/50 focus:outline-none"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical Only</option>
          <option value="warning">Warning Only</option>
          <option value="info">Info Only</option>
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-200 font-mono focus:border-cyan-500/50 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>

        <span className="ml-auto text-xs font-mono text-slate-400">
          {filteredAlerts.length} matching incident records
        </span>
      </Card>

      {/* Incidents Table */}
      <DataTable
        data={filteredAlerts}
        columns={columns}
        searchPlaceholder="Search incident descriptions, callsigns..."
        searchFilterKey="message"
        pageSize={12}
        onRowClick={handleRowClick}
      />
    </div>
  );
};
