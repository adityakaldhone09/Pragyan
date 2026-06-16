import { motion } from "motion/react";
import { cn } from "../utils/cn";
import { buttonVariants } from "../../utils/animations";

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "pink";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
  children: React.ReactNode;
  loading?: boolean;
}

export function GlowButton({
  variant = "primary",
  size = "md",
  glow = true,
  className,
  children,
  loading = false,
  type = "button",
  ...props
}: GlowButtonProps) {
  const variantClasses = {
    primary: "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)]",
    secondary: "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white hover:from-cyan-500 hover:to-cyan-600 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)]",
    accent: "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)]",
    pink: "bg-gradient-to-r from-pink-600 to-pink-700 text-white hover:from-pink-500 hover:to-pink-600 shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:shadow-[0_0_40px_rgba(236,72,153,0.6)]"
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <motion.button
      className={cn(
        "relative rounded-lg font-semibold transition-all duration-300 overflow-hidden",
        variantClasses[variant],
        sizeClasses[size],
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      variants={buttonVariants}
      whileHover={!loading ? "whileHover" : undefined}
      whileTap={!loading ? "whileTap" : undefined}
      initial="initial"
      disabled={loading}
      type={type}
      {...props}
    >
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-20"
        animate={loading ? { opacity: [0.2, 0.4, 0.2] } : {}}
        transition={{ duration: 1.5, repeat: loading ? Infinity : 0 }}
      />
      <motion.span
        animate={loading ? { opacity: [1, 0.6, 1] } : {}}
        transition={{ duration: 1.5, repeat: loading ? Infinity : 0 }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
}
