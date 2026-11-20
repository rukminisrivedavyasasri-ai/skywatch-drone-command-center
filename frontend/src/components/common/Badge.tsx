import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "cyan" | "emerald" | "amber" | "rose" | "violet" | "slate";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "cyan",
  size = "md",
  dot = false,
  className,
}) => {
  const variantStyles = {
    cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    rose: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    violet: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    slate: "bg-slate-700/40 text-slate-300 border-slate-600/40",
  };

  const dotColors = {
    cyan: "bg-cyan-400 shadow-cyan-400/80",
    emerald: "bg-emerald-400 shadow-emerald-400/80",
    amber: "bg-amber-400 shadow-amber-400/80",
    rose: "bg-rose-400 shadow-rose-400/80",
    violet: "bg-violet-400 shadow-violet-400/80",
    slate: "bg-slate-400 shadow-slate-400/80",
  };

  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 gap-1.5 font-medium",
    md: "text-xs px-2.5 py-1 gap-1.5 font-medium",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center rounded-full border tracking-wide uppercase font-mono",
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
    >
      {dot && (
        <span
          className={twMerge(
            clsx("w-1.5 h-1.5 rounded-full shadow-sm animate-pulse", dotColors[variant])
          )}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
