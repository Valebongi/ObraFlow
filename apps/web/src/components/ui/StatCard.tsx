import type { LucideIcon } from 'lucide-react';

type IconTone = 'dark' | 'amber' | 'green' | 'blue' | 'purple' | 'brand' | 'gray';

const iconTones: Record<IconTone, string> = {
  dark: 'bg-dark text-white',
  amber: 'bg-amber-500 text-white',
  green: 'bg-green-500 text-white',
  blue: 'bg-blue-500 text-white',
  purple: 'bg-purple-500 text-white',
  brand: 'bg-brand text-dark',
  gray: 'bg-gray-400 text-white',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'dark',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: IconTone;
}) {
  return (
    <div className="rounded-xl bg-white border border-border p-5">
      <div className="flex items-start justify-between">
        <p className="text-2xs font-semibold text-text-secondary uppercase tracking-wider">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconTones[tone]}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold text-text-primary">{value}</p>
    </div>
  );
}
