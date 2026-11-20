import { create } from "zustand";
import { Drone, Geofence, Alert, Detection, WSConnectionStatus } from "../types";

export type BaseMapLayer = "streets" | "satellite" | "terrain";

interface FleetState {
  // Telemetry & Fleet
  drones: Record<string, Drone>;
  selectedDroneId: string | null;
  droneTrails: Record<string, [number, number][]>; // Drone ID -> last 40 [lat, lon] positions
  
  // Geofences
  geofences: Geofence[];
  
  // Alerts & Incidents
  alerts: Alert[];
  unreadAlertCount: number;
  soundEnabled: boolean;
  
  // Detections
  detections: Detection[];
  
  // Map View Controls
  mapCenter: [number, number];
  mapZoom: number;
  flyToLocation: [number, number] | null;
  baseLayer: BaseMapLayer;
  showHeatmap: boolean;
  showTrails: boolean;
  showGeofences: boolean;
  showDetections: boolean;
  measurementTool: "none" | "distance" | "area";

  // Connection
  wsStatus: WSConnectionStatus;

  // Actions
  updateFleetTelemetry: (drones: Drone[]) => void;
  selectDrone: (id: string | null) => void;
  setGeofences: (geofences: Geofence[]) => void;
  addGeofence: (geofence: Geofence) => void;
  removeGeofence: (id: number) => void;
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (id: number, acknowledgedBy?: string) => void;
  resolveAlert: (id: number) => void;
  setDetections: (detections: Detection[]) => void;
  addDetection: (detection: any) => void;
  flyTo: (lat: number, lon: number, zoom?: number) => void;
  clearFlyTo: () => void;
  setBaseLayer: (layer: BaseMapLayer) => void;
  toggleHeatmap: () => void;
  toggleTrails: () => void;
  toggleGeofences: () => void;
  toggleDetections: () => void;
  toggleSound: () => void;
  setMeasurementTool: (tool: "none" | "distance" | "area") => void;
  setWsStatus: (status: WSConnectionStatus) => void;
}

export const useFleetStore = create<FleetState>((set, get) => ({
  drones: {},
  selectedDroneId: null,
  droneTrails: {},
  geofences: [],
  alerts: [],
  unreadAlertCount: 0,
  soundEnabled: true,
  detections: [],
  
  mapCenter: [17.385044, 78.486671], // Hyderabad HQ
  mapZoom: 13,
  flyToLocation: null,
  baseLayer: "streets",
  showHeatmap: false,
  showTrails: true,
  showGeofences: true,
  showDetections: true,
  measurementTool: "none",
  wsStatus: "connecting",

  updateFleetTelemetry: (newDrones: Drone[]) => {
    const currentTrails = { ...get().droneTrails };
    const droneMap: Record<string, Drone> = {};

    newDrones.forEach((d) => {
      droneMap[d.id] = d;
      const trail = currentTrails[d.id] ? [...currentTrails[d.id]] : [];
      trail.push([d.latitude, d.longitude]);
      // Keep last 35 points for smooth glowing trails
      if (trail.length > 35) {
        trail.shift();
      }
      currentTrails[d.id] = trail;
    });

    set({
      drones: droneMap,
      droneTrails: currentTrails,
    });
  },

  selectDrone: (id: string | null) => {
    set({ selectedDroneId: id });
    if (id && get().drones[id]) {
      const drone = get().drones[id];
      get().flyTo(drone.latitude, drone.longitude, 15);
    }
  },

  setGeofences: (geofences: Geofence[]) => set({ geofences }),
  addGeofence: (gf: Geofence) => set((s) => ({ geofences: [...s.geofences, gf] })),
  removeGeofence: (id: number) =>
    set((s) => ({ geofences: s.geofences.filter((g) => g.id !== id) })),

  setAlerts: (alerts: Alert[]) => {
    const unread = alerts.filter((a) => a.status === "active").length;
    set({ alerts, unreadAlertCount: unread });
  },

  addAlert: (alert: Alert) => {
    set((s) => ({
      alerts: [alert, ...s.alerts],
      unreadAlertCount: s.unreadAlertCount + 1,
    }));
  },

  acknowledgeAlert: (id: number, acknowledgedBy = "Tactical Operator") => {
    set((s) => ({
      alerts: s.alerts.map((a) =>
        a.id === id ? { ...a, status: "acknowledged", acknowledged_by: acknowledgedBy } : a
      ),
      unreadAlertCount: Math.max(0, s.unreadAlertCount - 1),
    }));
  },

  resolveAlert: (id: number) => {
    set((s) => ({
      alerts: s.alerts.map((a) =>
        a.id === id
          ? { ...a, status: "resolved", resolved_at: new Date().toISOString() }
          : a
      ),
      unreadAlertCount: Math.max(0, s.unreadAlertCount - 1),
    }));
  },

  setDetections: (detections: Detection[]) => set({ detections }),
  addDetection: (det: any) =>
    set((s) => ({
      detections: [det, ...s.detections],
    })),

  flyTo: (lat: number, lon: number, zoom = 14) => {
    set({ flyToLocation: [lat, lon], mapZoom: zoom });
  },

  clearFlyTo: () => set({ flyToLocation: null }),

  setBaseLayer: (layer: BaseMapLayer) => set({ baseLayer: layer }),
  toggleHeatmap: () => set((s) => ({ showHeatmap: !s.showHeatmap })),
  toggleTrails: () => set((s) => ({ showTrails: !s.showTrails })),
  toggleGeofences: () => set((s) => ({ showGeofences: !s.showGeofences })),
  toggleDetections: () => set((s) => ({ showDetections: !s.showDetections })),
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  setMeasurementTool: (tool: "none" | "distance" | "area") => set({ measurementTool: tool }),
  setWsStatus: (wsStatus: WSConnectionStatus) => set({ wsStatus }),
}));
