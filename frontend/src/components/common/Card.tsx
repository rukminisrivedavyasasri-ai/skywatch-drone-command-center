import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glow = false,
  hoverEffect = false,
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "glass-panel rounded-2xl p-5 transition-all duration-200 shadow-xl",
          glow && "border-cyan-500/30 shadow-cyan-500/10 shadow-lg",
          hoverEffect && "hover:border-white/20 hover:translate-y-[-2px] hover:shadow-2xl",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
