import React, { useState } from "react";
import { useMapEvents, Polyline, Polygon, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { Ruler, Square, Trash2, Check } from "lucide-react";
import { useFleetStore } from "../../store/fleetStore";

// Haversine formula for measurement
function calcDistance(points: [number, number][]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const lat1 = points[i][0];
    const lon1 = points[i][1];
    const lat2 = points[i + 1][0];
    const lon2 = points[i + 1][1];
    
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    total += R * c;
  }
  return total;
}

// Approximate planar area formula in square meters
function calcArea(points: [number, number][]): number {
  if (points.length < 3) return 0;
  const centerLat = points.reduce((acc, p) => acc + p[0], 0) / points.length;
  const latM = 111139;
  const lonM = 111139 * Math.cos((centerLat * Math.PI) / 180);

  const mPts = points.map((p) => [p[1] * lonM, p[0] * latM]);
  let area = 0;
  for (let i = 0; i < mPts.length; i++) {
    const j = (i + 1) % mPts.length;
    area += mPts[i][0] * mPts[j][1];
    area -= mPts[j][0] * mPts[i][1];
  }
  return Math.abs(area) / 2;
}

export const MeasurementTool: React.FC<{
  onCursorMove: (coords: [number, number]) => void;
}> = ({ onCursorMove }) => {
  const tool = useFleetStore((s) => s.measurementTool);
  const setTool = useFleetStore((s) => s.setMeasurementTool);
  const [points, setPoints] = useState<[number, number][]>([]);

  useMapEvents({
    mousemove(e) {
      onCursorMove([e.latlng.lat, e.latlng.lng]);
    },
    click(e) {
      if (tool === "none") return;
      setPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
    },
  });

  if (tool === "none" && points.length === 0) return null;

  const totalDistanceM = calcDistance(points);
  const totalAreaM2 = calcArea(points);

  const reset = () => {
    setPoints([]);
    setTool("none");
  };

  const pointIcon = L.divIcon({
    className: "measurement-node",
    html: `<div style="width: 10px; height: 10px; border-radius: 9999px; background: #22D3EE; border: 2px solid #0B1220;"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

  return (
    <>
      {/* Visual geometry on map */}
      {tool === "distance" && points.length >= 2 && (
        <Polyline
          positions={points}
          pathOptions={{ color: "#22D3EE", weight: 3, dashArray: "5, 5" }}
        />
      )}

      {tool === "area" && points.length >= 3 && (
        <Polygon
          positions={points}
          pathOptions={{
            color: "#8B5CF6",
            fillColor: "#8B5CF6",
            fillOpacity: 0.25,
            weight: 2.5,
          }}
        />
      )}

      {/* Point markers */}
      {points.map((pt, idx) => (
        <Marker key={idx} position={pt} icon={pointIcon} />
      ))}

      {/* Floating Tactical Measurement Control Bar */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] glass-panel px-4 py-2.5 rounded-2xl border border-cyan-500/30 shadow-2xl flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-300 font-semibold uppercase tracking-wider">
          {tool === "distance" ? (
            <Ruler className="w-4 h-4 text-cyan-400" />
          ) : (
            <Square className="w-4 h-4 text-violet-400" />
          )}
          <span>{tool === "distance" ? "Distance Tool" : "Area Tool"}</span>
        </div>

        <div className="h-4 w-px bg-white/10" />

        <div className="text-white font-bold">
          {tool === "distance" ? (
            totalDistanceM >= 1000 ? (
              <span>{(totalDistanceM / 1000).toFixed(2)} km</span>
            ) : (
              <span>{Math.round(totalDistanceM)} meters</span>
            )
          ) : totalAreaM2 >= 1000000 ? (
            <span>{(totalAreaM2 / 1000000).toFixed(3)} km&sup2;</span>
          ) : (
            <span>{(totalAreaM2 / 10000).toFixed(2)} hectares</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-2">
          <button
            onClick={reset}
            className="p-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors"
            title="Finish & Clear"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
};
