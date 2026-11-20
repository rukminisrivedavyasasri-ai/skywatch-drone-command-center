import React, { useState, useEffect } from "react";
import {
  X,
  Compass,
  Gauge,
  Battery,
  Wifi,
  Navigation,
  ShieldAlert,
  Play,
  Pause,
  Home,
  MapPin,
  TrendingUp,
  Cpu
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip
} from "recharts";
import { Drone } from "../../types";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { api } from "../../api/client";

interface TelemetryPanelProps {
  drone: Drone;
  onClose: () => void;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ drone, onClose }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingCmd, setIsLoadingCmd] = useState(false);
  const [cmdFeedback, setCmdFeedback] = useState<string | null>(null);

  // Fetch telemetry history for charts
  useEffect(() => {
    let isMounted = true;
    api.drones.get(drone.id).then((res) => {
      if (isMounted && res.history) {
        const formatted = res.history.map((h, i) => ({
          time: new Date(h.timestamp).toLocaleTimeString(),
          battery: Math.round(h.battery),
          altitude: Math.round(h.altitude),
          speed: h.speed,
        }));
        setHistory(formatted);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [drone.id]);

  const handleCommand = async (cmd: "return_to_base" | "pause" | "resume") => {
    setIsLoadingCmd(true);
    setCmdFeedback(null);
    try {
      const res = await api.drones.command(drone.id, cmd);
      setCmdFeedback(res.message);
      setTimeout(() => setCmdFeedback(null), 4000);
    } catch (err: any) {
      setCmdFeedback(`Failed: ${err.message}`);
    } finally {
      setIsLoadingCmd(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "cyan";
      case "returning":
        return "amber";
      case "low_battery":
        return "rose";
      default:
        return "slate";
    }
  };

  return (
    <div className="w-80 lg:w-96 glass-panel rounded-2xl border border-white/10 shadow-2xl p-5 flex flex-col space-y-4 select-none z-20">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-white tracking-wide">{drone.name}</h3>
            <Badge variant={getStatusBadgeVariant(drone.status)} size="sm" dot>
              {drone.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {drone.model} &bull; <span className="text-cyan-400">{drone.id}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Battery */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Battery className="w-4 h-4 text-emerald-400" /> Battery
            </span>
            <span className="font-mono font-bold text-white">{Math.round(drone.battery)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                drone.battery > 50
                  ? "bg-emerald-400"
                  : drone.battery > 20
                  ? "bg-amber-400"
                  : "bg-rose-500 animate-pulse"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, drone.battery))}%` }}
            />
          </div>
        </div>

        {/* Signal */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-cyan-400" /> RSSI Link
            </span>
            <span className="font-mono font-bold text-white">{drone.signal_strength}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, drone.signal_strength))}%` }}
            />
          </div>
        </div>

        {/* Altitude */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-violet-400" /> Altitude
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {drone.altitude.toFixed(1)} <span className="text-xs text-slate-400 font-normal">m AGL</span>
          </div>
        </div>

        {/* Speed */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-amber-400" /> Airspeed
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {drone.speed.toFixed(1)} <span className="text-xs text-slate-400 font-normal">m/s</span>
          </div>
        </div>
      </div>

      {/* Heading & GPS coordinates */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5 text-slate-400 font-sans">
            <Compass className="w-4 h-4 text-cyan-400" /> Heading Bearing
          </span>
          <span className="font-bold text-cyan-300">{Math.round(drone.heading)}&deg; DEG</span>
        </div>
        <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-white/5">
          <span className="flex items-center gap-1.5 text-slate-400 font-sans">
            <MapPin className="w-4 h-4 text-rose-400" /> GPS Coordinates
          </span>
          <span className="text-white font-bold">
            {drone.latitude.toFixed(5)}, {drone.longitude.toFixed(5)}
          </span>
        </div>
      </div>

      {/* Mini Altitude History Chart */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Altitude Flight Profile
          </span>
          <span className="font-mono text-cyan-400">{Math.round(drone.altitude)}m</span>
        </div>
        <div className="h-20 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history.length > 0 ? history : [{ altitude: drone.altitude }]}>
              <defs>
                <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#0B1220",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
              <Area
                type="monotone"
                dataKey="altitude"
                stroke="#22D3EE"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#altGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Command Feedback */}
      {cmdFeedback && (
        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyan-300 text-center animate-fade-in">
          {cmdFeedback}
        </div>
      )}

      {/* Tactical Commands Bar */}
      <div className="pt-2 border-t border-white/10 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Operator Fleet Controls
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            isLoading={isLoadingCmd}
            icon={<Home className="w-3.5 h-3.5 text-amber-400" />}
            onClick={() => handleCommand("return_to_base")}
          >
            Return Base
          </Button>

          <Button
            variant="secondary"
            size="sm"
            isLoading={isLoadingCmd}
            icon={
              drone.speed === 0 ? (
                <Play className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Pause className="w-3.5 h-3.5 text-cyan-400" />
              )
            }
            onClick={() => handleCommand(drone.speed === 0 ? "resume" : "pause")}
          >
            {drone.speed === 0 ? "Resume" : "Hover Hold"}
          </Button>
        </div>
      </div>
    </div>
  );
};
