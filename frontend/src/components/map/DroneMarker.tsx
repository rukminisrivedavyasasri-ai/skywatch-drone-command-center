import React from "react";
import { Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import { Drone } from "../../types";

interface DroneMarkerProps {
  drone: Drone;
  isSelected: boolean;
  onSelect: (drone: Drone) => void;
}

export const DroneMarker: React.FC<DroneMarkerProps> = ({
  drone,
  isSelected,
  onSelect,
}) => {
  // Status color mappings
  const statusColors = {
    active: { primary: "#22D3EE", glow: "rgba(34, 211, 238, 0.4)" },
    returning: { primary: "#F59E0B", glow: "rgba(245, 158, 11, 0.4)" },
    low_battery: { primary: "#EF4444", glow: "rgba(239, 68, 68, 0.6)" },
    offline: { primary: "#64748B", glow: "rgba(100, 116, 139, 0.2)" },
    emergency: { primary: "#DC2626", glow: "rgba(220, 38, 38, 0.8)" },
  };

  const currentColors = statusColors[drone.status] || statusColors.active;

  // Custom DivIcon with rotating SVG drone & pulse ring
  const customIcon = L.divIcon({
    className: "custom-drone-marker",
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <!-- Pulsing aura ring -->
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          border: 2px solid ${currentColors.primary};
          box-shadow: 0 0 14px ${currentColors.glow};
          animation: ${drone.status === 'low_battery' ? 'pulse 0.8s infinite' : 'none'};
          opacity: ${isSelected ? '1' : '0.75'};
          transform: scale(${isSelected ? '1.25' : '1.0'});
          transition: transform 0.2s ease;
        "></div>

        <!-- Rotating Drone Body by Heading -->
        <div style="
          transform: rotate(${drone.heading}deg);
          transition: transform 0.4s ease-out;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background: rgba(11, 18, 32, 0.85);
          border-radius: 9999px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        ">
          <!-- Quadcopter SVG -->
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${currentColors.primary}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Center body -->
            <circle cx="12" cy="12" r="3" fill="${currentColors.primary}" />
            <!-- Forward heading pointer -->
            <polygon points="12,2 15,9 9,9" fill="${currentColors.primary}" stroke="none" />
            <!-- Rotor Arms -->
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
            <!-- Rotors -->
            <circle cx="5" cy="5" r="2" />
            <circle cx="19" cy="5" r="2" />
            <circle cx="5" cy="19" r="2" />
            <circle cx="19" cy="19" r="2" />
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });

  return (
    <Marker
      position={[drone.latitude, drone.longitude]}
      icon={customIcon}
      eventHandlers={{
        click: () => onSelect(drone),
      }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={0.95}>
        <div className="font-mono text-xs px-1 py-0.5">
          <div className="font-bold text-white flex items-center gap-1.5">
            <span>{drone.name}</span>
            <span className="text-[10px] text-cyan-400">({drone.id})</span>
          </div>
          <div className="text-[10px] text-slate-300 mt-0.5 flex gap-2">
            <span>ALT: {Math.round(drone.altitude)}m</span>
            <span>BATT: {Math.round(drone.battery)}%</span>
            <span>SPD: {drone.speed}m/s</span>
          </div>
        </div>
      </Tooltip>
    </Marker>
  );
};
