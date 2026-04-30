interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function GlassButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: GlassButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95';

  const variants = {
    primary: 'gradient-primary text-white shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70',
    secondary: 'glass text-white hover:glass-strong border border-white/20',
    ghost: 'text-gray-300 hover:bg-white/10',
    outline: 'border-2 border-indigo-500/50 text-white hover:bg-indigo-500/20 hover:border-indigo-500'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
