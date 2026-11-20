import React from "react";
import { Card } from "./Card";
import { clsx } from "clsx";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  variant?: "cyan" | "emerald" | "amber" | "rose" | "violet";
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "cyan",
  className,
}) => {
  const iconColors = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  };

  return (
    <Card className={clsx("relative overflow-hidden group", className)}>
      {/* Background ambient glow */}
      <div className="absolute -right-8 -top-8 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors pointer-events-none" />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-white tracking-tight">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 font-sans">{subtitle}</p>
          )}
        </div>
        <div
          className={clsx(
            "p-3 rounded-xl border flex items-center justify-center shrink-0 shadow-inner",
            iconColors[variant]
          )}
        >
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center text-xs text-slate-400 font-mono">
          <span className="text-emerald-400 font-semibold mr-1.5">{trend}</span>
          <span>vs previous window</span>
        </div>
      )}
    </Card>
  );
};
