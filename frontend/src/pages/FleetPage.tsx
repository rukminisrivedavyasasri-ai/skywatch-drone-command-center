import React, { useState } from "react";
import {
  Plane,
  Battery,
  Gauge,
  TrendingUp,
  Compass,
  Wifi,
  Home,
  Pause,
  Play,
  Plus,
  Trash2,
  MapPin,
  Shield
} from "lucide-react";
import { useFleetStore } from "../store/fleetStore";
import { useAuthStore } from "../store/authStore";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { api } from "../api/client";
import { Drone } from "../types";

export const FleetPage: React.FC = () => {
  const drones = useFleetStore((s) => s.drones);
  const selectDrone = useFleetStore((s) => s.selectDrone);
  const user = useAuthStore((s) => s.user);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDroneId, setNewDroneId] = useState("");
  const [newDroneName, setNewDroneName] = useState("");
  const [newDroneModel, setNewDroneModel] = useState("DJI Matrice 350 RTK");
  const [newDroneSerial, setNewDroneSerial] = useState("");
  const [newDroneLat, setNewDroneLat] = useState("17.3850");
  const [newDroneLon, setNewDroneLon] = useState("78.4866");
  const [isLoading, setIsLoading] = useState(false);
  const [cmdFeedback, setCmdFeedback] = useState<string | null>(null);

  const droneList = Object.values(drones);
  const isAdmin = user?.role === "ADMIN";

  const handleCommand = async (droneId: string, cmd: "return_to_base" | "pause" | "resume") => {
    try {
      const res = await api.drones.command(droneId, cmd);
      setCmdFeedback(`${droneId}: ${res.message}`);
      setTimeout(() => setCmdFeedback(null), 3000);
    } catch (err: any) {
      setCmdFeedback(`Error: ${err.message}`);
    }
  };

  const handleCreateDrone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.drones.create({
        id: newDroneId.toUpperCase(),
        name: newDroneName,
        model: newDroneModel,
        serial_number: newDroneSerial || `SN-${Math.floor(Math.random() * 90000 + 10000)}`,
        latitude: parseFloat(newDroneLat),
        longitude: parseFloat(newDroneLon),
        altitude: 50.0,
      });
      setIsAddModalOpen(false);
      setNewDroneId("");
      setNewDroneName("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDrone = async (id: string) => {
    if (!confirm(`Are you sure you want to decommission ${id} from fleet?`)) return;
    try {
      await api.drones.delete(id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-wide text-white flex items-center gap-2.5">
            <Plane className="w-6 h-6 text-cyan-400" />
            Autonomous Drone Fleet Status
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time multi-UAV telemetry, autonomous patrol routes & remote mission control
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Deploy New Drone (Admin)
          </Button>
        )}
      </div>

      {/* Command Feedback */}
      {cmdFeedback && (
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          {cmdFeedback}
        </div>
      )}

      {/* Drones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {droneList.map((drone) => (
          <Card key={drone.id} hoverEffect className="space-y-4">
            {/* Card Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">{drone.name}</h3>
                  <span className="text-xs text-cyan-400 font-mono font-semibold">
                    {drone.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {drone.model}
                </p>
              </div>
              <Badge
                variant={
                  drone.status === "active"
                    ? "cyan"
                    : drone.status === "returning"
                    ? "amber"
                    : drone.status === "low_battery"
                    ? "rose"
                    : "slate"
                }
                size="sm"
                dot
              >
                {drone.status}
              </Badge>
            </div>

            {/* Gauges Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-slate-400 text-[10px] flex items-center gap-1.5 uppercase">
                  <Battery className="w-3.5 h-3.5 text-emerald-400" /> Battery
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white">
                    {Math.round(drone.battery)}%
                  </span>
                  <span className="text-[10px] text-slate-500">LiPo 6S</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-slate-400 text-[10px] flex items-center gap-1.5 uppercase">
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" /> RSSI Link
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white">
                    {drone.signal_strength}%
                  </span>
                  <span className="text-[10px] text-emerald-400">ENCRYPTED</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-slate-400 text-[10px] flex items-center gap-1.5 uppercase">
                  <TrendingUp className="w-3.5 h-3.5 text-violet-400" /> Altitude
                </span>
                <div className="text-base font-bold text-white">
                  {drone.altitude.toFixed(1)} <span className="text-[10px] text-slate-400">m</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-slate-400 text-[10px] flex items-center gap-1.5 uppercase">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" /> Speed
                </span>
                <div className="text-base font-bold text-white">
                  {drone.speed.toFixed(1)} <span className="text-[10px] text-slate-400">m/s</span>
                </div>
              </div>
            </div>

            {/* GPS coordinates & Heading */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs font-mono text-slate-300">
              <div className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{drone.latitude.toFixed(4)}, {drone.longitude.toFixed(4)}</span>
              </div>
              <div className="flex items-center gap-1 text-cyan-300">
                <Compass className="w-3.5 h-3.5" />
                <span>{Math.round(drone.heading)}&deg;</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCommand(drone.id, "return_to_base")}
                icon={<Home className="w-3.5 h-3.5 text-amber-400" />}
              >
                RTB
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCommand(drone.id, drone.speed === 0 ? "resume" : "pause")}
                icon={
                  drone.speed === 0 ? (
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Pause className="w-3.5 h-3.5 text-cyan-400" />
                  )
                }
              >
                {drone.speed === 0 ? "Resume" : "Hover"}
              </Button>

              {isAdmin && (
                <button
                  onClick={() => handleDeleteDrone(drone.id)}
                  title="Decommission Drone"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Add Drone Modal (Admin Only) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Deploy New Drone to Fleet"
      >
        <form onSubmit={handleCreateDrone} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 uppercase">Drone Call ID</label>
              <input
                type="text"
                required
                placeholder="DRONE-06"
                value={newDroneId}
                onChange={(e) => setNewDroneId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white font-mono focus:border-cyan-500/50 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 uppercase">Unit Callsign Name</label>
              <input
                type="text"
                required
                placeholder="Interceptor Delta"
                value={newDroneName}
                onChange={(e) => setNewDroneName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-300 uppercase">Model Specification</label>
            <input
              type="text"
              value={newDroneModel}
              onChange={(e) => setNewDroneModel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:border-cyan-500/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 uppercase">Deployment Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={newDroneLat}
                onChange={(e) => setNewDroneLat(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white font-mono focus:border-cyan-500/50 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 uppercase">Deployment Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={newDroneLon}
                onChange={(e) => setNewDroneLon(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white font-mono focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isLoading}>
              Confirm Deployment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
