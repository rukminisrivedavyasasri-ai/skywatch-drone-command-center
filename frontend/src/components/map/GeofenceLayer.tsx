import React from "react";
import { Polygon, Tooltip } from "react-leaflet";
import { Geofence } from "../../types";

interface GeofenceLayerProps {
  geofences: Geofence[];
}

export const GeofenceLayer: React.FC<GeofenceLayerProps> = ({ geofences }) => {
  const getStyle = (type: string) => {
    switch (type) {
      case "restricted":
        return {
          color: "#EF4444",
          fillColor: "#EF4444",
          fillOpacity: 0.18,
          weight: 2.5,
          dashArray: "6, 6",
        };
      case "patrol":
        return {
          color: "#38BDF8",
          fillColor: "#0284C7",
          fillOpacity: 0.15,
          weight: 2,
        };
      case "safe":
        return {
          color: "#22C55E",
          fillColor: "#22C55E",
          fillOpacity: 0.15,
          weight: 2,
        };
      default:
        return {
          color: "#8B5CF6",
          fillColor: "#8B5CF6",
          fillOpacity: 0.15,
          weight: 2,
        };
    }
  };

  return (
    <>
      {geofences.map((gf) => {
        if (!gf.coordinates || gf.coordinates.length < 3) return null;
        const style = getStyle(gf.zone_type);

        return (
          <Polygon key={gf.id} positions={gf.coordinates} pathOptions={style}>
            <Tooltip sticky direction="center" opacity={0.9}>
              <div className="font-mono text-xs px-2 py-1 text-slate-100">
                <div className="font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      gf.zone_type === "restricted"
                        ? "bg-rose-500"
                        : gf.zone_type === "patrol"
                        ? "bg-cyan-400"
                        : "bg-emerald-400"
                    }`}
                  />
                  {gf.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Type: {gf.zone_type.toUpperCase()} | Alt: {gf.min_altitude}-{gf.max_altitude}m
                </div>
              </div>
            </Tooltip>
          </Polygon>
        );
      })}
    </>
  );
};
