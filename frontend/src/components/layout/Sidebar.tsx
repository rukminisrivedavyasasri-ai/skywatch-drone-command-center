import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  MapPin,
  Plane,
  Eye,
  Crosshair,
  AlertTriangle,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
  Radio
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useFleetStore } from "../../store/fleetStore";

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const unreadAlerts = useFleetStore((s) => s.unreadAlertCount);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Live Operations", path: "/", icon: MapPin },
    { name: "Fleet Telemetry", path: "/fleet", icon: Plane },
    { name: "AI Vision Detection", path: "/detection", icon: Eye },
    { name: "Mission Planner", path: "/missions", icon: Crosshair },
    {
      name: "Alerts & Incidents",
      path: "/alerts",
      icon: AlertTriangle,
      badge: unreadAlerts > 0 ? unreadAlerts : null,
    },
    { name: "Tactical Analytics", path: "/analytics", icon: BarChart3 },
    { name: "System Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between glass-panel border-r border-white/10 transition-all duration-300 z-30 select-none ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-4 border-b border-white/10 gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
            <Radio className="w-5 h-5 text-slate-950 animate-pulse" />
            <div className="absolute inset-0 rounded-xl border border-cyan-300/40" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-base tracking-wider text-white flex items-center gap-1.5">
                SKYWATCH
                <span className="text-[10px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded font-mono font-normal">
                  v1.0
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight">
                DEFENCE & SECURITY HQ
              </p>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/5 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  } ${collapsed ? "justify-center" : ""}`
                }
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
                {!collapsed && <span className="truncate">{item.name}</span>}
                {item.badge && (
                  <span
                    className={`rounded-full bg-rose-500 text-white font-mono font-bold text-[10px] flex items-center justify-center ${
                      collapsed
                        ? "absolute top-1.5 right-1.5 w-4 h-4 text-[9px]"
                        : "ml-auto px-2 py-0.5"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {/* Tooltip on collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-slate-200 text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-white/10 font-sans">
                    {item.name}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Operator & Collapse */}
      <div className="p-3 border-t border-white/10 space-y-2">
        {/* User Card */}
        <div
          className={`flex items-center gap-3 p-2 rounded-xl bg-slate-900/50 border border-white/5 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
            <Shield className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.full_name || "Tactical Operator"}
              </p>
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">
                {user?.role || "OPERATOR"}
              </span>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-xs font-mono"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="ml-1 text-[11px]">COLLAPSE</span>}
        </button>
      </div>
    </aside>
  );
};
