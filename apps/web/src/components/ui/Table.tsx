import { ChevronsUpDown } from 'lucide-react';

export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className={`w-full ${className}`}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-border">{children}</thead>;
}

const thClass =
  'text-left px-4 py-3 text-2xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap';

export function TH({
  children,
  sortable,
  className = '',
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { sortable?: boolean }) {
  return (
    <th
      className={`${thClass} ${sortable ? 'cursor-pointer select-none hover:text-text-primary' : ''} ${className}`}
      {...props}
    >
      {sortable ? (
        <span className="inline-flex items-center gap-1">
          {children}
          <ChevronsUpDown className="h-3 w-3 text-text-muted" />
        </span>
      ) : (
        children
      )}
    </th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function TR({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`hover:bg-surface-secondary transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TD({ children, className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3 text-sm text-text-primary whitespace-nowrap ${className}`} {...props}>
      {children}
    </td>
  );
}
