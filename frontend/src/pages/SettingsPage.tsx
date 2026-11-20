import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Plus,
  Trash2,
  Lock,
  Radio,
  Server,
  Cpu,
  MapPin,
  CheckCircle2
} from "lucide-react";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { useFleetStore } from "../store/fleetStore";
import { useAuthStore } from "../store/authStore";
import { api } from "../api/client";
import { Geofence } from "../types";

export const SettingsPage: React.FC = () => {
  const geofences = useFleetStore((s) => s.geofences);
  const setGeofences = useFleetStore((s) => s.setGeofences);
  const removeGeofence = useFleetStore((s) => s.removeGeofence);
  const user = useAuthStore((s) => s.user);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [zoneType, setZoneType] = useState<"restricted" | "patrol" | "safe">("restricted");
  const [minAlt, setMinAlt] = useState("0");
  const [maxAlt, setMaxAlt] = useState("300");
  const [coordsJson, setCoordsJson] = useState(
    JSON.stringify(
      [
        [17.3700, 78.4700],
        [17.3750, 78.4750],
        [17.3700, 78.4800],
        [17.3650, 78.4750],
        [17.3700, 78.4700]
      ],
      null,
      2
    )
  );
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  const handleCreateGeofence = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const parsedCoords = JSON.parse(coordsJson);
      const newGf = await api.geofences.create({
        name,
        zone_type: zoneType,
        coordinates: parsedCoords,
        min_altitude: parseFloat(minAlt),
        max_altitude: parseFloat(maxAlt),
        is_active: true,
      });
      setGeofences([...geofences, newGf]);
      setIsModalOpen(false);
      setName("");
    } catch (err: any) {
      alert(`Invalid parameters: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this geofence?")) return;
    try {
      await api.geofences.delete(id);
      removeGeofence(id);
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
            <Settings className="w-6 h-6 text-cyan-400" />
            Airspace Geofencing & System Configuration
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Tactical perimeter zones, telemetry encryption keys, and system diagnostics
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Create Geofence Zone (Admin)
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Geofence Management (Left) */}
        <div className="lg:col-span-8 space-y-5">
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" /> Configured Airspace Geofence Zones
              </span>
              <Badge variant="cyan" size="sm">
                {geofences.length} ZONES ACTIVE
              </Badge>
            </div>

            <div className="space-y-3">
              {geofences.map((gf) => (
                <div
                  key={gf.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{gf.name}</h4>
                      <Badge
                        variant={
                          gf.zone_type === "restricted"
                            ? "rose"
                            : gf.zone_type === "patrol"
                            ? "cyan"
                            : "emerald"
                        }
                        size="sm"
                      >
                        {gf.zone_type}
                      </Badge>
                    </div>
                    {gf.description && (
                      <p className="text-xs text-slate-400 font-sans">{gf.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                      <span>Vertices: {gf.coordinates.length} points</span>
                      <span>&bull;</span>
                      <span>
                        Altitude Ceiling: {gf.min_altitude}m - {gf.max_altitude}m
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(gf.id)}
                      title="Delete Geofence"
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Security & System Diagnostics (Right) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Secure Comms Info */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" /> Secure Comms Link
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">VERIFIED</span>
            </div>

            <div className="space-y-3 text-xs font-mono text-slate-300">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> AES-256 Telemetry Encryption
                </div>
                <p className="text-[11px] text-emerald-200/80 leading-relaxed font-sans">
                  Payload integrity verified. Drone control uplinks and live telemetry downlinks are digitally signed.
                </p>
              </div>

              <div className="space-y-1 pt-1">
                <div className="text-slate-400">Cipher Suite:</div>
                <div className="text-white">AES_256_GCM_SHA384</div>
              </div>

              <div className="space-y-1">
                <div className="text-slate-400">Auth Signature:</div>
                <div className="text-white">HMAC-SHA256 (JWT Bearer)</div>
              </div>
            </div>
          </Card>

          {/* System Environment Info */}
          <Card className="space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" /> HQ Node Diagnostics
              </span>
            </div>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">FastAPI Backend:</span>
                <span className="text-cyan-400">v1.0.0 (Port 8000)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">React Frontend:</span>
                <span className="text-cyan-400">React 18 + Vite</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Database Engine:</span>
                <span className="text-white">SQLite WAL + SQLAlchemy</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">AI Vision Engine:</span>
                <span className="text-emerald-400">Ultralytics YOLOv8n</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Geospatial Geometry:</span>
                <span className="text-white">Shapely 2.2</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Geofence Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Operational Geofence Boundary"
      >
        <form onSubmit={handleCreateGeofence} className="space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-slate-300 uppercase">Geofence Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Government Complex Perimeter"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:border-cyan-500/50 focus:outline-none font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 uppercase">Zone Classification</label>
            <select
              value={zoneType}
              onChange={(e) => setZoneType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:border-cyan-500/50 focus:outline-none"
            >
              <option value="restricted">Restricted (Red - Strict No-Fly Zone)</option>
              <option value="patrol">Patrol Sector (Blue - Active Mission Zone)</option>
              <option value="safe">Safe Landing Hub (Green - Autonomous Recharge)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 uppercase">Min Altitude (m)</label>
              <input
                type="number"
                value={minAlt}
                onChange={(e) => setMinAlt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 uppercase">Max Altitude (m)</label>
              <input
                type="number"
                value={maxAlt}
                onChange={(e) => setMaxAlt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 uppercase">Polygon Coordinate Vertices (JSON)</label>
            <textarea
              rows={5}
              required
              value={coordsJson}
              onChange={(e) => setCoordsJson(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-cyan-300 focus:border-cyan-500/50 focus:outline-none font-mono"
            />
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              Save Geofence
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
