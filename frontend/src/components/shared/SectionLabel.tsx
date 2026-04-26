export function SectionLabel({
  label,
  dark = false,
  className = '',
}: {
  label: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="w-1 h-5 shrink-0 bg-accent rounded-full mt-[2px]" />
      <span
        className={`font-body text-[14.4px] font-bold uppercase tracking-[0.04em] leading-tight ${
          dark ? 'text-white/85' : 'text-text-dark'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
