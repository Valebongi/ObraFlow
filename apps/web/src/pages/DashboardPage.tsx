import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  CircleAlert,
  Play,
  Users,
  CircleCheck,
  Wrench,
  TriangleAlert,
  Plus,
  Calendar,
  CalendarDays,
  Clock,
  Building2,
  MapPin,
  FileText,
  HardHat,
  Briefcase,
  Truck,
  Package,
  ChartColumn,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { WOStatus } from '@obraflow/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { WO_STATUS_LABEL } from '@/lib/labels';
import { formatNumber } from '@/lib/format';

interface MonthlyPoint {
  month: string;
  creadas: number;
  completadas: number;
  canceladas: number;
  costTotal: number;
}

interface OrgStats {
  totalWorkOrders: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  activeCrews: number;
  totalWorkers: number;
  totalClients: number;
  monthlyWOs: MonthlyPoint[];
  monthlyCosts: { month: string; costTotal: number }[];
  lowStockCount: number;
  overdueCount: number;
}

interface RecentOrder {
  id: string;
  code?: string;
  title?: string;
  status?: WOStatus;
  createdAt?: string;
  client?: { name?: string } | null;
}

const EMPTY_STATS: OrgStats = {
  totalWorkOrders: 0,
  byStatus: {},
  byType: {},
  activeCrews: 0,
  totalWorkers: 0,
  totalClients: 0,
  monthlyWOs: [],
  monthlyCosts: [],
  lowStockCount: 0,
  overdueCount: 0,
};

const STATUS_COLORS: Record<string, string> = {
  [WOStatus.PENDING]: '#8E9196',
  [WOStatus.ASSIGNED]: '#1E88E5',
  [WOStatus.IN_PROGRESS]: '#F5C518',
  [WOStatus.PAUSED]: '#FB8C00',
  [WOStatus.COMPLETED]: '#43A047',
  [WOStatus.INVOICED]: '#111111',
  [WOStatus.CANCELLED]: '#E53935',
};

const QUICK_LINKS: { label: string; to: string; icon: LucideIcon; color: string }[] = [
  { label: 'Órdenes de Trabajo', to: '/work-orders', icon: ClipboardList, color: 'bg-dark text-white' },
  { label: 'Planificación', to: '/planning', icon: CalendarDays, color: 'bg-blue-50 text-blue-600' },
  { label: 'Parte de Horas', to: '/timesheets', icon: Clock, color: 'bg-amber-50 text-amber-600' },
  { label: 'Clientes', to: '/clients', icon: Building2, color: 'bg-purple-50 text-purple-600' },
  { label: 'Ubicaciones', to: '/locations', icon: MapPin, color: 'bg-rose-50 text-rose-600' },
  { label: 'Contratos', to: '/contracts', icon: FileText, color: 'bg-slate-100 text-slate-600' },
  { label: 'Cuadrillas', to: '/crews', icon: HardHat, color: 'bg-orange-50 text-orange-600' },
  { label: 'Trabajadores', to: '/workers', icon: Users, color: 'bg-indigo-50 text-indigo-600' },
  { label: 'Subcontratistas', to: '/subcontractors', icon: Briefcase, color: 'bg-teal-50 text-teal-600' },
  { label: 'Vehículos', to: '/vehicles', icon: Truck, color: 'bg-cyan-50 text-cyan-600' },
  { label: 'Materiales', to: '/materials', icon: Package, color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Reportes', to: '/reports', icon: ChartColumn, color: 'bg-brand-light text-brand-dark' },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días,';
  if (h < 19) return 'Buenas tardes,';
  return 'Buenas noches,';
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  to,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  iconBg: string;
  to?: string;
}) {
  const inner = (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</p>
        <div className="mt-2">
          <p className="text-3xl font-bold text-text-primary">{formatNumber(value)}</p>
        </div>
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className="text-white w-5 h-5" />
      </div>
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="bg-white rounded-xl border border-border p-5 shadow-xs cursor-pointer hover:shadow transition-shadow duration-200 block"
      >
        {inner}
      </Link>
    );
  }
  return <div className="bg-white rounded-xl border border-border p-5 shadow-xs">{inner}</div>;
}

export default function DashboardPage() {
  const user = useAuth((s) => s.user);
  const [stats, setStats] = useState<OrgStats>(EMPTY_STATS);
  const [recent, setRecent] = useState<RecentOrder[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get('/organization/stats');
        if (active) setStats({ ...EMPTY_STATS, ...data });
      } catch {
        /* ignore — keep zeros */
      }
    })();
    (async () => {
      try {
        const { data } = await api.get('/work-orders', { params: { page: 1, limit: 5 } });
        if (active) setRecent(data.data ?? []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const chartData: MonthlyPoint[] =
    stats.monthlyWOs.length > 0
      ? stats.monthlyWOs
      : ['Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'].map((month) => ({
          month,
          creadas: 0,
          completadas: 0,
          canceladas: 0,
          costTotal: 0,
        }));

  const distribution = Object.entries(stats.byStatus)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-6 flex-1">
      {/* Greeting + primary action */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-text-muted text-sm">{greeting()}</p>
          <h1 className="text-2xl font-bold text-text-primary">{user?.name ?? 'demo'}</h1>
        </div>
        <Link
          to="/work-orders/create"
          className="inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg bg-brand text-dark hover:bg-brand-hover focus:ring-brand/40 shadow-brand h-9 px-4 text-sm"
        >
          <Plus className="h-4 w-4" />
          Nueva orden
        </Link>
      </div>

      {/* Stat cards — row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total órdenes"
          value={stats.totalWorkOrders}
          icon={ClipboardList}
          iconBg="bg-dark"
          to="/work-orders"
        />
        <StatCard
          label="Pendientes"
          value={stats.byStatus[WOStatus.PENDING] ?? 0}
          icon={CircleAlert}
          iconBg="bg-amber-500"
          to="/work-orders"
        />
        <StatCard
          label="En ejecución"
          value={stats.byStatus[WOStatus.IN_PROGRESS] ?? 0}
          icon={Play}
          iconBg="bg-emerald-600"
          to="/work-orders"
        />
        <StatCard
          label="Cuadrillas activas"
          value={stats.activeCrews}
          icon={Users}
          iconBg="bg-blue-600"
          to="/crews"
        />
      </div>

      {/* Stat cards — row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Completadas"
          value={stats.byStatus[WOStatus.COMPLETED] ?? 0}
          icon={CircleCheck}
          iconBg="bg-gray-500"
        />
        <StatCard
          label="Clientes"
          value={stats.totalClients}
          icon={Wrench}
          iconBg="bg-purple-600"
          to="/clients"
        />
        <StatCard
          label="Trabajadores"
          value={stats.totalWorkers}
          icon={Users}
          iconBg="bg-indigo-600"
          to="/workers"
        />
        <StatCard
          label="Vencidas"
          value={stats.overdueCount}
          icon={TriangleAlert}
          iconBg="bg-gray-500"
          to="/work-orders"
        />
      </div>

      {/* Quick access hub */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group flex flex-col items-start gap-3 rounded-xl bg-white border border-border p-4 shadow-xs transition-all hover:shadow hover:-translate-y-0.5"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${link.color}`}>
                <link.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-text-primary group-hover:text-brand-dark leading-tight">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Monthly activity */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-border p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-text-primary">Actividad mensual</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Órdenes creadas vs completadas (últimos 6 meses)
              </p>
            </div>
            <Calendar className="h-4 w-4 text-text-muted" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillCreadas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5C518" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#F5C518" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillCompletadas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#43A047" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#43A047" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E2" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#A0A0A0' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#A0A0A0' }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #E2E2E2',
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="creadas"
                  name="Creadas"
                  stroke="#F5C518"
                  strokeWidth={2}
                  fill="url(#fillCreadas)"
                />
                <Area
                  type="monotone"
                  dataKey="completadas"
                  name="Completadas"
                  stroke="#43A047"
                  strokeWidth={2}
                  fill="url(#fillCompletadas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status distribution */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="font-semibold text-text-primary">Estado de órdenes</h2>
            <p className="text-xs text-text-muted mt-0.5">Distribución actual</p>
          </div>
          {distribution.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-text-muted text-sm">
              Sin datos
            </div>
          ) : (
            <div className="space-y-3">
              {distribution.map(([status, count]) => {
                const pct = stats.totalWorkOrders
                  ? Math.round((count / stats.totalWorkOrders) * 100)
                  : 0;
                const color = STATUS_COLORS[status] ?? '#8E9196';
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2 text-text-primary">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {WO_STATUS_LABEL[status as WOStatus] ?? status}
                      </span>
                      <span className="font-medium text-text-secondary">{count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-tertiary overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-border shadow-xs">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-text-primary">Órdenes recientes</h2>
          <Link
            to="/work-orders"
            className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
          >
            Ver todas
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recent.length === 0 ? (
            <div className="py-10 text-center text-text-muted text-sm">Sin órdenes recientes</div>
          ) : (
            recent.map((o) => (
              <Link
                key={o.id}
                to={`/work-orders/${o.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-secondary transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {o.title ?? o.code ?? 'Orden'}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {o.code}
                    {o.client?.name ? ` · ${o.client.name}` : ''}
                  </p>
                </div>
                {o.status && (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${STATUS_COLORS[o.status] ?? '#8E9196'}1A`,
                      color: STATUS_COLORS[o.status] ?? '#8E9196',
                    }}
                  >
                    {WO_STATUS_LABEL[o.status] ?? o.status}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
