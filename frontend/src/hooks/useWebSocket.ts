import { useEffect, useRef } from "react";
import { useFleetStore } from "../store/fleetStore";
import { getToken } from "../api/client";

// Web Audio API tactical alert sound generator
function playTacticalBeep(severity: "info" | "warning" | "critical") {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = severity === "critical" ? "sawtooth" : severity === "warning" ? "triangle" : "sine";
    osc.frequency.setValueAtTime(severity === "critical" ? 880 : severity === "warning" ? 640 : 440, ctx.currentTime);
    
    // Quick tactical pulse
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  const updateFleetTelemetry = useFleetStore((s) => s.updateFleetTelemetry);
  const addAlert = useFleetStore((s) => s.addAlert);
  const addDetection = useFleetStore((s) => s.addDetection);
  const setWsStatus = useFleetStore((s) => s.setWsStatus);
  const soundEnabled = useFleetStore((s) => s.soundEnabled);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      const token = getToken();
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/telemetry${token ? `?token=${token}` : ""}`;

      setWsStatus(reconnectAttemptsRef.current === 0 ? "connecting" : "reconnecting");
      
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          console.log("[WS CLIENT] Connected to SkyWatch Telemetry Stream.");
          setWsStatus("connected");
          reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === "FLEET_TELEMETRY" && Array.isArray(data.drones)) {
              updateFleetTelemetry(data.drones);
            } else if (data.type === "ALERT_NEW" && data.alert) {
              addAlert(data.alert);
              if (soundEnabled) {
                playTacticalBeep(data.alert.severity);
              }
            } else if (data.type === "DETECTION_NEW" && data.detection) {
              addDetection(data.detection);
            }
          } catch (err) {
            console.error("[WS CLIENT] Message parse error:", err);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setWsStatus("disconnected");
          // Exponential backoff reconnect: min 1s, max 10s
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
          reconnectAttemptsRef.current += 1;
          console.warn(`[WS CLIENT] Disconnected. Reconnecting in ${Math.round(delay / 1000)}s...`);
          reconnectTimeoutRef.current = window.setTimeout(connect, delay);
        };

        ws.onerror = () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };
      } catch (err) {
        console.error("[WS CLIENT] Connection failed:", err);
        setWsStatus("disconnected");
      }
    }

    connect();

    // Heartbeat ping every 25 seconds
    const pingInterval = window.setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "PING" }));
      }
    }, 25000);

    return () => {
      isMounted = false;
      window.clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [updateFleetTelemetry, addAlert, addDetection, setWsStatus, soundEnabled]);
}
