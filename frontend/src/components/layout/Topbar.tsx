import React, { useState, useEffect } from "react";
import {
  Bell,
  Volume2,
  VolumeX,
  Lock,
  Wifi,
  WifiOff,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useFleetStore } from "../../store/fleetStore";
import { Badge } from "../common/Badge";

export const Topbar: React.FC = () => {
  const [timeUtc, setTimeUtc] = useState("");
  const [timeLocal, setTimeLocal] = useState("");
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  
  const wsStatus = useFleetStore((s) => s.wsStatus);
  const soundEnabled = useFleetStore((s) => s.soundEnabled);
  const toggleSound = useFleetStore((s) => s.toggleSound);
  const alerts = useFleetStore((s) => s.alerts);
  const unreadCount = useFleetStore((s) => s.unreadAlertCount);
  const flyTo = useFleetStore((s) => s.flyTo);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().slice(17, 25) + " UTC");
      setTimeLocal(now.toLocaleTimeString());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isConnected = wsStatus === "connected";

  return (
    <header className="h-16 glass-panel border-b border-white/10 px-6 flex items-center justify-between z-20 select-none">
      {/* Left: Quick search / Mission Indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/5">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search drones, zones, alerts..."
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-48 lg:w-64 font-sans"
          />
        </div>

        {/* Secure Link Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <Lock className="w-3.5 h-3.5" />
          <span>AES-256 COMMS</span>
        </div>
      </div>

      {/* Right: Telemetry Clock, Audio Toggle, Alert Bell, WS Status */}
      <div className="flex items-center gap-4">
        {/* Live Mission Clock */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/60 border border-white/5 font-mono text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{timeLocal}</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400 font-semibold">{timeUtc}</span>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          title={soundEnabled ? "Tactical audio alerts enabled" : "Muted"}
          className={`p-2 rounded-xl border transition-colors ${
            soundEnabled
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
              : "bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300"
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* WebSocket Connection Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono uppercase tracking-wider transition-colors ${
            isConnected
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse"
          }`}
        >
          {isConnected ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          <span>{wsStatus}</span>
        </div>

        {/* Notification Alert Bell with Flyout */}
        <div className="relative">
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            className="relative p-2 rounded-xl bg-slate-800/60 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Quick Alert Feed Dropdown */}
          {showAlertMenu && (
            <div className="absolute right-0 mt-3 w-80 lg:w-96 glass-panel rounded-2xl border border-white/10 shadow-2xl p-4 space-y-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Tactical Alert Stream
                </span>
                <Badge variant={unreadCount > 0 ? "rose" : "slate"} size="sm">
                  {unreadCount} Active
                </Badge>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {alerts.slice(0, 8).map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      if (alert.latitude && alert.longitude) {
                        flyTo(alert.latitude, alert.longitude, 16);
                        setShowAlertMenu(false);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      alert.severity === "critical"
                        ? "bg-rose-950/40 border-rose-500/30 hover:bg-rose-950/60"
                        : "bg-slate-900/60 border-white/5 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1">
                      <span className="uppercase font-bold text-slate-300">
                        {alert.drone_id || "SYSTEM"}
                      </span>
                      <span>{new Date(alert.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-200 line-clamp-2">{alert.message}</p>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-center text-xs text-slate-500 py-6">
                    All sectors clear. No active alerts.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
