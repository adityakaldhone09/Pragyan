interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: 'primary' | 'secondary' | 'accent' | 'success';
}

export function AnimatedProgress({
  value,
  max = 100,
  className = '',
  showLabel = false,
  color = 'primary'
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    primary: 'from-indigo-500 to-purple-500',
    secondary: 'from-blue-500 to-indigo-500',
    accent: 'from-purple-500 to-pink-500',
    success: 'from-green-500 to-emerald-500'
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
        <div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full transition-all duration-1000 ease-out shadow-lg`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>
      {showLabel && (
        <p className="mt-2 text-sm text-gray-400">{Math.round(percentage)}% complete</p>
      )}
    </div>
  );
}
