interface TagProps {
  children: React.ReactNode;
  onRemove?: () => void;
  variant?: 'default' | 'primary';
}

export function Tag({ children, onRemove, variant = 'default' }: TagProps) {
  const styles = variant === 'primary'
    ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
    : 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${styles}`}>
      <span className="text-sm">{children}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
          type="button"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
