import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30",
    secondary:
      "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-slate-600",
    danger:
      "bg-rose-600/90 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30",
    ghost:
      "bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white",
    outline:
      "bg-transparent border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 hover:bg-cyan-500/10",
  };

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-5 py-2.5 gap-2.5",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={twMerge(clsx(baseStyles, variantStyles[variant], sizeStyles[size], className))}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
