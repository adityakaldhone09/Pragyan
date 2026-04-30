interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, max = 100, className = '', showLabel = false }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-sm text-[#475569]">{Math.round(percentage)}% complete</p>
      )}
    </div>
  );
}
