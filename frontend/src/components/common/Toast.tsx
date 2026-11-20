import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { Alert } from "../../types";

interface ToastProps {
  alerts: Alert[];
  onDismiss: (id: number) => void;
  onFlyTo?: (lat: number, lon: number) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({
  alerts,
  onDismiss,
  onFlyTo,
}) => {
  // Show at most 3 recent critical or warning active alerts
  const displayAlerts = alerts
    .filter((a) => a.status === "active" && (a.severity === "critical" || a.severity === "warning"))
    .slice(0, 3);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {displayAlerts.map((alert) => {
          const isCrit = alert.severity === "critical";
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-xl shadow-2xl flex items-start gap-3 transition-colors ${
                isCrit
                  ? "bg-rose-950/85 border-rose-500/50 text-rose-100 shadow-rose-900/30"
                  : "bg-amber-950/85 border-amber-500/50 text-amber-100 shadow-amber-900/30"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isCrit ? (
                  <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div className="flex-1 text-xs">
                <div className="font-semibold uppercase tracking-wider text-[11px] mb-0.5 flex items-center justify-between">
                  <span>{alert.alert_type.replace("_", " ")}</span>
                  <span className="opacity-75 font-mono">{alert.drone_id || "SYSTEM"}</span>
                </div>
                <p className="line-clamp-2 leading-relaxed opacity-90">{alert.message}</p>
                {alert.latitude && alert.longitude && onFlyTo && (
                  <button
                    onClick={() => onFlyTo(alert.latitude!, alert.longitude!)}
                    className="mt-2 text-[11px] underline font-mono text-cyan-300 hover:text-cyan-200 block text-left"
                  >
                    Locate on Map &rarr;
                  </button>
                )}
              </div>
              <button
                onClick={() => onDismiss(alert.id)}
                className="shrink-0 opacity-60 hover:opacity-100 p-0.5 rounded transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
