import type { ReactNode } from "react";

interface ListRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  end?: ReactNode;
  onClick?: () => void;
  compact?: boolean;
}

export function ListRow({ title, subtitle, end, onClick, compact = false }: ListRowProps) {
  const className = `flex w-full items-center gap-3 border-t border-line text-left ${compact ? "py-2.5" : "px-4 py-3 md:px-5"}`;
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="font-medium wrap-anywhere">{title}</div>
        {subtitle && <div className="text-[13px] text-muted">{subtitle}</div>}
      </div>
      {end && <div className="flex shrink-0 items-center gap-3">{end}</div>}
    </>
  );

  return (
    <li className="first:*:border-t-0">
      {onClick ? (
        <button type="button" onClick={onClick} className={`${className} hover:bg-hover`}>
          {content}
        </button>
      ) : (
        <div className={className}>{content}</div>
      )}
    </li>
  );
}
