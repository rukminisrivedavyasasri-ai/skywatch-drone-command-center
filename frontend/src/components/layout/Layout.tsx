import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ToastContainer } from "../common/Toast";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useFleetStore } from "../../store/fleetStore";

export const Layout: React.FC = () => {
  // Activate global 1Hz WebSocket telemetry listener
  useWebSocket();

  const alerts = useFleetStore((s) => s.alerts);
  const resolveAlert = useFleetStore((s) => s.resolveAlert);
  const flyTo = useFleetStore((s) => s.flyTo);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B1220]">
      {/* Left Collapsible Tactical Sidebar */}
      <Sidebar />

      {/* Main Command Surface */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative">
        <Topbar />
        <main className="flex-1 overflow-y-auto relative">
          <Outlet />
        </main>
      </div>

      {/* Floating Tactical Toast Notification Stream */}
      <ToastContainer
        alerts={alerts}
        onDismiss={resolveAlert}
        onFlyTo={(lat, lon) => flyTo(lat, lon, 16)}
      />
    </div>
  );
};
