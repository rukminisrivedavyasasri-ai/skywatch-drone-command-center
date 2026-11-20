import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap
} from "react-leaflet";
import L from "leaflet";
import {
  Layers,
  Flame,
  Route,
  Shield,
  Crosshair,
  Ruler,
  Square,
  Eye,
  MapPin
} from "lucide-react";
import { useFleetStore, BaseMapLayer } from "../../store/fleetStore";
import { DroneMarker } from "./DroneMarker";
import { GeofenceLayer } from "./GeofenceLayer";
import { MeasurementTool } from "./MeasurementTool";
import { Drone } from "../../types";

// Map Controller for smooth flyTo transitions
function MapViewController({
  flyToLocation,
  zoom,
  onClear,
}: {
  flyToLocation: [number, number] | null;
  zoom: number;
  onClear: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (flyToLocation) {
      map.flyTo(flyToLocation, zoom, { duration: 1.5, easeLinearity: 0.25 });
      onClear();
    }
  }, [flyToLocation, zoom, map, onClear]);

  return null;
}

export const TacticalMap: React.FC<{
  onSelectDrone: (drone: Drone) => void;
}> = ({ onSelectDrone }) => {
  const [cursorCoords, setCursorCoords] = useState<[number, number]>([17.385044, 78.486671]);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [darkMapFailed, setDarkMapFailed] = useState(false);

  // Store state
  const drones = useFleetStore((s) => s.drones);
  const selectedDroneId = useFleetStore((s) => s.selectedDroneId);
  const droneTrails = useFleetStore((s) => s.droneTrails);
  const geofences = useFleetStore((s) => s.geofences);
  const detections = useFleetStore((s) => s.detections);
  const mapCenter = useFleetStore((s) => s.mapCenter);
  const mapZoom = useFleetStore((s) => s.mapZoom);
  const flyToLocation = useFleetStore((s) => s.flyToLocation);
  const clearFlyTo = useFleetStore((s) => s.clearFlyTo);

  const baseLayer = useFleetStore((s) => s.baseLayer);
  const setBaseLayer = useFleetStore((s) => s.setBaseLayer);
  const showHeatmap = useFleetStore((s) => s.showHeatmap);
  const toggleHeatmap = useFleetStore((s) => s.toggleHeatmap);
  const showTrails = useFleetStore((s) => s.showTrails);
  const toggleTrails = useFleetStore((s) => s.toggleTrails);
  const showGeofences = useFleetStore((s) => s.showGeofences);
  const toggleGeofences = useFleetStore((s) => s.toggleGeofences);
  const showDetections = useFleetStore((s) => s.showDetections);
  const toggleDetections = useFleetStore((s) => s.toggleDetections);
  const measurementTool = useFleetStore((s) => s.measurementTool);
  const setMeasurementTool = useFleetStore((s) => s.setMeasurementTool);

  const droneList = Object.values(drones);

  // Tile layer configurations
  const tileLayers: Record<BaseMapLayer, { url: string; attribution: string }> = {
    streets: {
      url: darkMapFailed
        ? "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      attribution: darkMapFailed
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        : "Tiles © Esri",
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles © Esri",
    },
    terrain: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles © Esri",
    },
  };

  // Detection Marker Icon
  const createDetectionIcon = (className: string) =>
    L.divIcon({
      className: "detection-pin",
      html: `
        <div style="
          width: 26px; height: 26px; border-radius: 9999px;
          background: rgba(239, 68, 68, 0.25);
          border: 2px solid #EF4444;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
          display: flex; align-items: center; justify-content: center;
          font-family: monospace; font-size: 10px; font-weight: bold; color: white;
        ">
          !
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

  return (
    <div className="relative w-full h-full overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <MapViewController
          flyToLocation={flyToLocation}
          zoom={mapZoom}
          onClear={clearFlyTo}
        />

        {/* Selected Base Tile Layer */}
        <TileLayer
          key={`${baseLayer}-${darkMapFailed ? "fallback" : "primary"}`}
          url={tileLayers[baseLayer].url}
          attribution={tileLayers[baseLayer].attribution}
          maxZoom={19}
          eventHandlers={{
            tileerror: () => {
              if (baseLayer === "streets" && !darkMapFailed) {
                console.warn("Esri dark basemap failed to load; switching to OpenStreetMap fallback.");
                setDarkMapFailed(true);
              }
            },
          }}
        />

        {/* Glowing Drone Flight Path Trails */}
        {showTrails &&
          Object.entries(droneTrails).map(([droneId, trail]) => {
            if (trail.length < 2) return null;
            return (
              <Polyline
                key={`trail-${droneId}`}
                positions={trail}
                pathOptions={{
                  color: "#22D3EE",
                  weight: 2.5,
                  opacity: 0.65,
                  dashArray: "3, 6",
                }}
              />
            );
          })}

        {/* Geofence Polygons */}
        {showGeofences && <GeofenceLayer geofences={geofences} />}

        {/* AI Geotagged Detections */}
        {showDetections &&
          detections.slice(0, 30).map((det) => (
            <Marker
              key={`det-${det.id}`}
              position={[det.latitude, det.longitude]}
              icon={createDetectionIcon(det.class_name)}
            >
              <Popup>
                <div className="text-xs font-mono space-y-1">
                  <div className="font-bold text-rose-400 uppercase">
                    AI Object: {det.class_name}
                  </div>
                  <div>Confidence: {Math.round(det.confidence * 100)}%</div>
                  <div>Drone: {det.drone_id || "Recon Unit"}</div>
                  <div className="text-[10px] text-slate-400">
                    GPS: {det.latitude.toFixed(5)}, {det.longitude.toFixed(5)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Animated Drone Fleet Markers */}
        {droneList.map((drone) => (
          <DroneMarker
            key={drone.id}
            drone={drone}
            isSelected={selectedDroneId === drone.id}
            onSelect={onSelectDrone}
          />
        ))}

        {/* Interactive Measurement Overlay */}
        <MeasurementTool onCursorMove={setCursorCoords} />
      </MapContainer>

      {/* Floating Tactical Layer & Tool Controls (Top-Right) */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-2">
        {/* Layer Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            title="Layer Switcher"
            className="p-2.5 rounded-xl glass-panel border border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/40 shadow-xl transition-all"
          >
            <Layers className="w-4 h-4" />
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 mt-2 w-52 glass-panel rounded-2xl border border-white/10 shadow-2xl p-3 space-y-2 text-xs font-mono select-none">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Basemap Layer
              </p>
              {(["streets", "satellite", "terrain"] as BaseMapLayer[]).map((layer) => (
                <button
                  key={layer}
                  onClick={() => {
                    setBaseLayer(layer);
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg uppercase transition-colors ${
                    baseLayer === layer
                      ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  {layer}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Toggle Heatmap */}
        <button
          onClick={toggleHeatmap}
          title="Incident Heatmap"
          className={`p-2.5 rounded-xl glass-panel border transition-all shadow-xl ${
            showHeatmap
              ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
              : "border-white/10 text-slate-300 hover:text-white"
          }`}
        >
          <Flame className="w-4 h-4" />
        </button>

        {/* Toggle Trails */}
        <button
          onClick={toggleTrails}
          title="Flight Path Trails"
          className={`p-2.5 rounded-xl glass-panel border transition-all shadow-xl ${
            showTrails
              ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
              : "border-white/10 text-slate-300 hover:text-white"
          }`}
        >
          <Route className="w-4 h-4" />
        </button>

        {/* Toggle Geofences */}
        <button
          onClick={toggleGeofences}
          title="Geofences"
          className={`p-2.5 rounded-xl glass-panel border transition-all shadow-xl ${
            showGeofences
              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
              : "border-white/10 text-slate-300 hover:text-white"
          }`}
        >
          <Shield className="w-4 h-4" />
        </button>

        {/* Toggle Detections */}
        <button
          onClick={toggleDetections}
          title="AI Detections"
          className={`p-2.5 rounded-xl glass-panel border transition-all shadow-xl ${
            showDetections
              ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
              : "border-white/10 text-slate-300 hover:text-white"
          }`}
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {/* Measurement Tool Toggle */}
        <div className="flex items-center rounded-xl glass-panel border border-white/10 p-0.5 shadow-xl">
          <button
            onClick={() =>
              setMeasurementTool(measurementTool === "distance" ? "none" : "distance")
            }
            title="Measure Distance"
            className={`p-2 rounded-lg transition-colors ${
              measurementTool === "distance"
                ? "bg-cyan-500/20 text-cyan-300"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Ruler className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              setMeasurementTool(measurementTool === "area" ? "none" : "area")
            }
            title="Measure Area"
            className={`p-2 rounded-lg transition-colors ${
              measurementTool === "area"
                ? "bg-violet-500/20 text-violet-300"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Square className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cursor GPS Coordinates Pill (Bottom-Right) */}
      <div className="absolute bottom-4 right-4 z-[400] glass-panel px-3 py-1.5 rounded-xl border border-white/10 shadow-lg text-[11px] font-mono text-slate-300 flex items-center gap-2 select-none pointer-events-none">
        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
        <span>
          {cursorCoords[0].toFixed(5)}&deg; N, {cursorCoords[1].toFixed(5)}&deg; E
        </span>
        <span className="text-slate-500">|</span>
        <span className="text-cyan-400">HYDERABAD SECTOR</span>
      </div>
    </div>
  );
};
