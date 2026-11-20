import React, { useEffect } from "react";
import {
  Radio,
  AlertTriangle,
  Eye,
  MapPin,
  Plane,
  Battery,
  Shield,
  Layers,
  Activity,
  Crosshair
} from "lucide-react";
import { TacticalMap } from "../components/map/TacticalMap";
import { TelemetryPanel } from "../components/map/TelemetryPanel";
import { Badge } from "../components/common/Badge";
import { useFleetStore } from "../store/fleetStore";
import { api } from "../api/client";
import { Drone } from "../types";

export const MapPage: React.FC = () => {
  const drones = useFleetStore((s) => s.drones);
  const selectedDroneId = useFleetStore((s) => s.selectedDroneId);
  const selectDrone = useFleetStore((s) => s.selectDrone);
  const alerts = useFleetStore((s) => s.alerts);
  const detections = useFleetStore((s) => s.detections);
  const unreadAlertCount = useFleetStore((s) => s.unreadAlertCount);
  const setGeofences = useFleetStore((s) => s.setGeofences);
  const setAlerts = useFleetStore((s) => s.setAlerts);
  const setDetections = useFleetStore((s) => s.setDetections);
  const flyTo = useFleetStore((s) => s.flyTo);

  const droneList = Object.values(drones);
  const activeDronesCount = droneList.filter((d) => d.status === "active").length;
  const selectedDrone = selectedDroneId ? drones[selectedDroneId] : null;

  // Initial load
  useEffect(() => {
    let isMounted = true;

    // Load initial geofences
    api.geofences.list().then((res) => {
      if (isMounted) setGeofences(res);
    });

    // Load initial alerts
    api.alerts.list().then((res) => {
      if (isMounted) setAlerts(res);
    });

    // Load initial detections
    api.detections.list(30).then((res) => {
      if (isMounted) setDetections(res);
    });

    return () => {
      isMounted = false;
    };
  }, [setGeofences, setAlerts, setDetections]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="cyan" size="sm" dot>Active</Badge>;
      case "returning":
        return <Badge variant="amber" size="sm" dot>Returning</Badge>;
      case "low_battery":
        return <Badge variant="rose" size="sm" dot>Low Batt</Badge>;
      default:
        return <Badge variant="slate" size="sm">Offline</Badge>;
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* 1. Full-Screen Interactive Tactical Map */}
      <TacticalMap onSelectDrone={(d) => selectDrone(d.id)} />

      {/* 2. Top Floating Tactical Overview Stats Bar */}
      <div className="absolute top-4 left-6 z-[300] hidden md:flex items-center gap-3 glass-panel px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
        {/* Drones Online */}
        <div className="flex items-center gap-2.5 pr-4 border-r border-white/10">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              Fleet Online
            </div>
            <div className="text-sm font-bold font-mono text-white">
              {activeDronesCount} <span className="text-xs text-slate-500">/ {droneList.length || 5}</span>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="flex items-center gap-2.5 pr-4 border-r border-white/10">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              Active Alerts
            </div>
            <div className="text-sm font-bold font-mono text-rose-400">
              {unreadAlertCount} <span className="text-xs text-slate-500">SECTORS</span>
            </div>
          </div>
        </div>

        {/* Detections Today */}
        <div className="flex items-center gap-2.5 pr-4 border-r border-white/10">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              AI Detections
            </div>
            <div className="text-sm font-bold font-mono text-violet-300">
              {detections.length || 14} <span className="text-xs text-slate-500">TAGGED</span>
            </div>
          </div>
        </div>

        {/* Area Covered */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              Surveillance Grid
            </div>
            <div className="text-sm font-bold font-mono text-emerald-300">
              28.4 <span className="text-xs text-slate-500">km&sup2;</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Floating Left Fleet List Panel */}
      <div className="absolute top-24 left-6 z-[300] hidden lg:block w-72 glass-panel rounded-2xl border border-white/10 shadow-2xl p-4 space-y-3 max-h-[calc(100vh-140px)] flex flex-col">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <span className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
            <Plane className="w-4 h-4 text-cyan-400" /> Fleet Telemetry
          </span>
          <span className="text-[11px] font-mono text-cyan-400">
            {droneList.length} UNITS
          </span>
        </div>

        <div className="overflow-y-auto space-y-2 pr-1 flex-1">
          {droneList.map((drone) => {
            const isSelected = selectedDroneId === drone.id;
            return (
              <div
                key={drone.id}
                onClick={() => selectDrone(drone.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-cyan-500/15 border-cyan-400 shadow-md shadow-cyan-500/10"
                    : "bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-xs text-white tracking-wide">
                      {drone.name}
                    </div>
                    <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                      {drone.id}
                    </div>
                  </div>
                  {getStatusBadge(drone.status)}
                </div>

                {/* Mini Telemetry Gauges */}
                <div className="mt-2.5 pt-2 border-t border-white/5 grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[9px]">ALT</span>
                    <span>{Math.round(drone.altitude)}m</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">BATT</span>
                    <span
                      className={
                        drone.battery < 20
                          ? "text-rose-400 font-bold"
                          : drone.battery < 50
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }
                    >
                      {Math.round(drone.battery)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">SPD</span>
                    <span>{drone.speed.toFixed(1)}m/s</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Floating Right Panel: Telemetry Details OR Live Alerts Feed */}
      <div className="absolute top-24 right-6 z-[300]">
        {selectedDrone ? (
          <TelemetryPanel
            drone={selectedDrone}
            onClose={() => selectDrone(null)}
          />
        ) : (
          /* Live Sector Alerts Feed when no drone is explicitly clicked */
          <div className="hidden lg:block w-80 glass-panel rounded-2xl border border-white/10 shadow-2xl p-4 space-y-3 max-h-[calc(100vh-140px)] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Live Sector Alerts
              </span>
              <Badge variant="amber" size="sm">
                1Hz Sync
              </Badge>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => {
                    if (alert.latitude && alert.longitude) {
                      flyTo(alert.latitude, alert.longitude, 16);
                    }
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                    alert.severity === "critical"
                      ? "bg-rose-950/40 border-rose-500/30 hover:bg-rose-950/60"
                      : alert.severity === "warning"
                      ? "bg-amber-950/30 border-amber-500/30 hover:bg-amber-950/50"
                      : "bg-slate-900/60 border-white/5 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1">
                    <span className="uppercase font-bold text-cyan-300">
                      {alert.drone_id || "PERIMETER"}
                    </span>
                    <span>{new Date(alert.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-200 line-clamp-2 leading-relaxed">
                    {alert.message}
                  </p>
                  {alert.latitude && alert.longitude && (
                    <div className="mt-2 text-[10px] text-cyan-400 font-mono hover:underline">
                      &rarr; Zoom to Incident GPS
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
