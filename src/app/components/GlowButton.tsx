import { motion } from "motion/react";
import { cn } from "../utils/cn";

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "pink";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
  children: React.ReactNode;
}

export function GlowButton({
  variant = "primary",
  size = "md",
  glow = true,
  className,
  children,
  type = "button",
  ...props
}: GlowButtonProps) {
  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(139,92,246,0.4)]",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_0_20px_rgba(6,182,212,0.4)]",
    accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_20px_rgba(59,130,246,0.4)]",
    pink: "bg-pink text-pink-foreground hover:bg-pink/90 shadow-[0_0_20px_rgba(236,72,153,0.4)]"
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <motion.button
      className={cn(
        "relative rounded-lg font-medium transition-all duration-300",
        variantClasses[variant],
        sizeClasses[size],
        glow && "hover:shadow-[0_0_30px_rgba(139,92,246,0.6)]",
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      type={type}
      {...props}
    >
      {children}
    </motion.button>
  );
}
