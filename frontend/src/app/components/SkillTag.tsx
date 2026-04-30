interface SkillTagProps {
  children: React.ReactNode;
  onRemove?: () => void;
  variant?: 'default' | 'primary' | 'success';
}

export function SkillTag({ children, onRemove, variant = 'default' }: SkillTagProps) {
  const variants = {
    default: 'bg-white/10 text-gray-300 border-white/20',
    primary: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    success: 'bg-green-500/20 text-green-300 border-green-500/30'
  };

  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm ${variants[variant]} transition-all duration-200 hover:scale-105`}>
      <span className="text-sm font-medium">{children}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
