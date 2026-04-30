interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  strong?: boolean;
}

export function GlassCard({ children, className = '', hover = false, strong = false }: GlassCardProps) {
  return (
    <div
      className={`${strong ? 'glass-strong' : 'glass'} rounded-2xl ${
        hover ? 'hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer transform hover:scale-[1.02]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
