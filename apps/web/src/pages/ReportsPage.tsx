import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ChartColumn,
  CircleCheck,
  TrendingUp,
  Users,
  Clock,
  Download,
  FileDown,
} from 'lucide-react';
import { WOStatus, WOType, WO_STATUS_COLORS } from '@obraflow/shared';
import { api } from '@/lib/api';
import { WO_STATUS_LABEL, WO_TYPE_LABEL } from '@/lib/labels';

interface WorkOrderRow {
  id: string;
  status: WOStatus;
  type: WOType;
  createdAt: string;
  closedAt?: string | null;
  actualEnd?: string | null;
}

const TYPE_COLORS: Record<WOType, string> = {
  [WOType.CORRECTIVE]: '#F5C518',
  [WOType.PREVENTIVE]: '#1E88E5',
  [WOType.INSTALLATION]: '#43A047',
  [WOType.INSPECTION]: '#8E5BF5',
  [WOType.EMERGENCY]: '#E53935',
};

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function ReportsPage() {
  const [orders, setOrders] = useState<WorkOrderRow[]>([]);
  const [crewsActive, setCrewsActive] = useState(0);
  const [workersTotal, setWorkersTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [woRes, crewRes, workerRes] = await Promise.all([
        api.get('/work-orders', { params: { page: 1, limit: 1000 } }),
        api.get('/crews', { params: { page: 1, limit: 1000 } }),
        api.get('/workers', { params: { page: 1, limit: 1000 } }),
      ]);
      setOrders(woRes.data.data ?? []);
      const crews = (crewRes.data.data ?? []) as Array<{ status?: string }>;
      setCrewsActive(crews.filter((c) => c.status && c.status !== 'OFF').length);
      setWorkersTotal(workerRes.data.meta?.total ?? (workerRes.data.data ?? []).length);
    } catch {
      setOrders([]);
      setCrewsActive(0);
      setWorkersTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = orders.length;
  const completed = orders.filter(
    (o) => o.status === WOStatus.COMPLETED || o.status === WOStatus.INVOICED,
  ).length;
  const inProgress = orders.filter((o) => o.status === WOStatus.IN_PROGRESS).length;
  const completion = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Distribution by status
  const statusData = useMemo(() => {
    const counts = new Map<WOStatus, number>();
    orders.forEach((o) => counts.set(o.status, (counts.get(o.status) ?? 0) + 1));
    return (Object.values(WOStatus) as WOStatus[])
      .map((s) => ({ status: s, name: WO_STATUS_LABEL[s], value: counts.get(s) ?? 0 }))
      .filter((d) => d.value > 0);
  }, [orders]);

  // Distribution by type
  const typeData = useMemo(() => {
    const counts = new Map<WOType, number>();
    orders.forEach((o) => counts.set(o.type, (counts.get(o.type) ?? 0) + 1));
    return (Object.values(WOType) as WOType[])
      .map((t) => ({ type: t, name: WO_TYPE_LABEL[t], value: counts.get(t) ?? 0 }))
      .filter((d) => d.value > 0);
  }, [orders]);

  // Monthly evolution (last 6 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; creadas: number; completadas: number; canceladas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: MONTH_LABELS[d.getMonth()],
        creadas: 0,
        completadas: 0,
        canceladas: 0,
      });
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    const bucketOf = (v?: string | null) => {
      if (!v) return -1;
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return -1;
      return idx.get(`${d.getFullYear()}-${d.getMonth()}`) ?? -1;
    };
    orders.forEach((o) => {
      const bi = bucketOf(o.createdAt);
      if (bi >= 0) buckets[bi].creadas += 1;
      if (o.status === WOStatus.COMPLETED || o.status === WOStatus.INVOICED) {
        const ci = bucketOf(o.closedAt ?? o.actualEnd ?? o.createdAt);
        if (ci >= 0) buckets[ci].completadas += 1;
      }
      if (o.status === WOStatus.CANCELLED && bi >= 0) buckets[bi].canceladas += 1;
    });
    return buckets;
  }, [orders]);

  const hasMonthly = monthlyData.some((m) => m.creadas || m.completadas || m.canceladas);

  function exportCSV() {
    const rows: string[][] = [['Estado', 'Cantidad']];
    (Object.values(WOStatus) as WOStatus[]).forEach((s) => {
      const count = orders.filter((o) => o.status === s).length;
      rows.push([WO_STATUS_LABEL[s], String(count)]);
    });
    rows.push(['Total', String(total)]);
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-obraflow-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    if (!containerRef.current) return;
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    const canvas = await html2canvas(containerRef.current, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`reporte-obraflow-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  const stats = [
    { icon: ChartColumn, iconClass: 'text-dark', value: total, label: 'Total órdenes' },
    { icon: CircleCheck, iconClass: 'text-emerald-600', value: `${completion}%`, label: 'Completitud' },
    { icon: TrendingUp, iconClass: 'text-brand', value: crewsActive, label: 'Cuadrillas activas' },
    { icon: Users, iconClass: 'text-blue-600', value: workersTotal, label: 'Trabajadores' },
    { icon: Clock, iconClass: 'text-amber-600', value: inProgress, label: 'En ejecución' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6" ref={containerRef}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reportes y Análisis</h1>
          <p className="text-sm text-text-muted mt-0.5">Métricas operacionales de tu organización</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg bg-white text-text-primary border border-border hover:bg-surface-secondary focus:ring-dark/20 h-8 px-3 text-sm"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={exportPDF}
            className="inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg bg-white text-text-primary border border-border hover:bg-surface-secondary focus:ring-dark/20 h-8 px-3 text-sm"
          >
            <FileDown className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-border shadow-xs p-5 text-center">
            <s.icon className={`h-6 w-6 ${s.iconClass} mx-auto mb-2`} />
            <p className="text-3xl font-bold text-text-primary">{loading ? '—' : s.value}</p>
            <p className="text-xs text-text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        <div className="xl:col-span-2 bg-white rounded-xl border border-border shadow-xs p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-text-primary">Evolución mensual</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Órdenes creadas vs completadas vs canceladas (últimos 6 meses)
            </p>
          </div>
          {hasMonthly ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E2" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#717171' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#717171' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="creadas" name="Creadas" fill="#1E88E5" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="completadas" name="Completadas" fill="#43A047" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="canceladas" name="Canceladas" fill="#E53935" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-52 text-text-muted text-sm">
              Sin órdenes en los últimos 6 meses
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-border shadow-xs p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-text-primary">Estado actual</h2>
            <p className="text-xs text-text-muted mt-0.5">Distribución por estado</p>
          </div>
          {statusData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {statusData.map((d) => (
                      <Cell key={d.status} fill={WO_STATUS_COLORS[d.status]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">Sin datos</div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-border shadow-xs p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-text-primary">Por tipo de trabajo</h2>
            <p className="text-xs text-text-muted mt-0.5">Distribución de órdenes por categoría</p>
          </div>
          {typeData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                    {typeData.map((d) => (
                      <Cell key={d.type} fill={TYPE_COLORS[d.type]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">Sin datos</div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-border shadow-xs p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-text-primary">Resumen por estado</h2>
            <p className="text-xs text-text-muted mt-0.5">Conteo detallado de órdenes</p>
          </div>
          {statusData.length > 0 ? (
            <div className="space-y-2">
              {statusData.map((d) => (
                <div key={d.status} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-text-secondary">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: WO_STATUS_COLORS[d.status] }} />
                    {d.name}
                  </span>
                  <span className="font-semibold text-text-primary">{d.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                <span className="font-medium text-text-primary">Total</span>
                <span className="font-bold text-text-primary">{total}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-text-muted">Sin datos disponibles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
