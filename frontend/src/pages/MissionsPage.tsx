import React, { useState, useEffect } from "react";
import {
  Crosshair,
  MapPin,
  Clock,
  Battery,
  TrendingUp,
  Activity,
  Play,
  Save,
  Check,
  Send,
  Layers,
  ChevronRight
} from "lucide-react";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { useFleetStore } from "../store/fleetStore";
import { api } from "../api/client";
import { Mission, MissionPlanResponse } from "../types";

export const MissionsPage: React.FC = () => {
  const drones = useFleetStore((s) => s.drones);
  const flyTo = useFleetStore((s) => s.flyTo);

  const [missions, setMissions] = useState<Mission[]>([]);
  const [altitude, setAltitude] = useState<number>(60);
  const [overlap, setOverlap] = useState<number>(70);
  const [missionName, setMissionName] = useState<string>("Autonomous Grid Survey Sector-A");
  const [selectedDroneId, setSelectedDroneId] = useState<string>("DRONE-01");
  const [planResult, setPlanResult] = useState<MissionPlanResponse | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const droneList = Object.values(drones);

  // Default sample polygon for survey around Hyderabad (Hussain Sagar / Tech corridor)
  const defaultSurveyPolygon = [
    [17.3820, 78.4820],
    [17.3820, 78.4900],
    [17.3890, 78.4900],
    [17.3890, 78.4820],
    [17.3820, 78.4820]
  ];

  // Load existing missions
  useEffect(() => {
    api.missions.list().then((res) => {
      setMissions(res);
    });
  }, []);

  const handleGeneratePlan = async () => {
    setIsPlanning(true);
    setFeedback(null);
    try {
      const plan = await api.missions.plan(defaultSurveyPolygon, altitude, overlap, missionName);
      setPlanResult(plan);
    } catch (err: any) {
      alert(`Planning failed: ${err.message}`);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleSaveAndAssign = async () => {
    if (!planResult) return;
    setIsAssigning(true);
    try {
      // 1. Save planned mission
      const saved = await api.missions.save(planResult);
      // 2. Assign to drone
      const assigned = await api.missions.assign(saved.id, selectedDroneId);
      setFeedback(`Mission assigned to ${selectedDroneId}! Drone is navigating.`);
      // Refresh list
      const updated = await api.missions.list();
      setMissions(updated);
      // Jump map to start
      if (planResult.waypoints && planResult.waypoints.length > 0) {
        flyTo(planResult.waypoints[0].latitude, planResult.waypoints[0].longitude, 15);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-wide text-white flex items-center gap-2.5">
            <Crosshair className="w-6 h-6 text-cyan-400" />
            Autonomous Lawnmower Survey Flight Planner
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Boustrophedon decomposition grid algorithm, camera footprint geometry & autonomous waypoint execution
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Planner Controls (Left) */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                Mission Configuration
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">BOUSTROPHEDON</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-slate-300 uppercase block mb-1">
                  Mission Callsign
                </label>
                <input
                  type="text"
                  value={missionName}
                  onChange={(e) => setMissionName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                />
              </div>

              {/* Altitude Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Target Altitude</span>
                  <span className="text-cyan-300 font-bold">{altitude}m AGL</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  value={altitude}
                  onChange={(e) => setAltitude(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>20m (High GSD)</span>
                  <span>120m (Max Legal Ceiling)</span>
                </div>
              </div>

              {/* Overlap Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Lateral Overlap</span>
                  <span className="text-violet-300 font-bold">{overlap}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="85"
                  value={overlap}
                  onChange={(e) => setOverlap(Number(e.target.value))}
                  className="w-full accent-violet-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>30% (Fast sweep)</span>
                  <span>85% (Photogrammetry 3D)</span>
                </div>
              </div>

              {/* Drone Assignee */}
              <div>
                <label className="text-xs font-mono text-slate-300 uppercase block mb-1">
                  Assigned Drone Unit
                </label>
                <select
                  value={selectedDroneId}
                  onChange={(e) => setSelectedDroneId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white font-mono focus:border-cyan-500/50 focus:outline-none"
                >
                  {droneList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.id}) - Batt: {Math.round(d.battery)}%
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isPlanning}
                onClick={handleGeneratePlan}
                icon={<Crosshair className="w-4 h-4" />}
              >
                Compute Lawnmower Flight Path
              </Button>
            </div>
          </Card>
        </div>

        {/* Plan Output & Waypoints (Right) */}
        <div className="lg:col-span-7 space-y-5">
          {planResult ? (
            <Card className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  Calculated Flight Metrics
                </span>
                <Badge variant="cyan" size="sm">
                  {planResult.waypoints.length} WAYPOINTS
                </Badge>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block">Distance</span>
                  <div className="text-lg font-bold text-white">
                    {planResult.estimated_distance_km} <span className="text-xs text-slate-400 font-normal">km</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block">Flight Time</span>
                  <div className="text-lg font-bold text-cyan-300">
                    {planResult.estimated_duration_minutes} <span className="text-xs text-slate-400 font-normal">min</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block">Battery Cost</span>
                  <div className="text-lg font-bold text-amber-300">
                    {planResult.estimated_battery_cost}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block">Covered Area</span>
                  <div className="text-lg font-bold text-emerald-300">
                    {planResult.area_km2} <span className="text-xs text-slate-400 font-normal">km&sup2;</span>
                  </div>
                </div>
              </div>

              {/* Waypoints Sequence List */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase">
                  Flight Waypoint Vector Sequence:
                </span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
                  {planResult.waypoints.map((wp) => (
                    <div
                      key={wp.sequence}
                      className="p-2 rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-between text-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">
                          {wp.sequence}
                        </span>
                        <span>
                          [{wp.latitude.toFixed(5)}, {wp.longitude.toFixed(5)}]
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase">
                        {wp.action} &bull; {wp.altitude}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Launch Button */}
              <div className="pt-2 border-t border-white/10 flex justify-end">
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={isAssigning}
                  onClick={handleSaveAndAssign}
                  icon={<Send className="w-4 h-4" />}
                >
                  Assign & Launch Drone Autonomously
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center py-20 text-center text-slate-500 space-y-2">
              <Crosshair className="w-12 h-12 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">
                No active survey flight plan generated yet
              </p>
              <p className="text-xs max-w-sm text-slate-500">
                Configure altitude, overlap and boundary, then click "Compute Lawnmower Flight Path" to generate waypoints.
              </p>
            </Card>
          )}

          {/* Previous Missions Log */}
          {missions.length > 0 && (
            <Card className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  Mission Registry History
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {missions.length} RECORDED
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
                {missions.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white">{m.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Drone: {m.drone_id || "Unassigned"} &bull; {m.estimated_distance_km}km &bull; {m.area_km2}km&sup2;
                      </div>
                    </div>
                    <Badge variant={m.status === "in_progress" ? "cyan" : "slate"} size="sm">
                      {m.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
