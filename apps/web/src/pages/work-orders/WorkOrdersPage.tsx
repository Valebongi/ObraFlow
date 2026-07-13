import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, Search, Filter, ChevronsUpDown, ChevronRight } from 'lucide-react';
import { WOStatus, WOPriority } from '@obraflow/shared';
import { api } from '@/lib/api';
import {
  WO_STATUS_LABEL,
  WO_STATUS_TONE,
  WO_PRIORITY_LABEL,
  WO_PRIORITY_TONE,
  WO_TYPE_LABEL,
} from '@/lib/labels';
import { formatDate, formatNumber } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';

interface WorkOrderRow {
  id: string;
  code: string;
  title: string;
  status: WOStatus;
  priority: WOPriority;
  type: keyof typeof WO_TYPE_LABEL;
  clientName?: string;
  locationName?: string;
  plannedStart?: string;
  plannedEnd?: string;
  assignedCrewName?: string;
  costTotal?: number;
  estimatedHours?: number;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

const thBase =
  'text-left px-4 py-3 text-2xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap';

function SortIcon() {
  return (
    <span className="text-text-muted">
      <ChevronsUpDown className="h-3.5 w-3.5" />
    </span>
  );
}

export default function WorkOrdersPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<WorkOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState<'title' | 'plannedEnd' | ''>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, lastPage: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/work-orders', {
        params: {
          page,
          limit: 20,
          ...(search && { search }),
          ...(status && { status }),
          ...(priority && { priority }),
          ...(sort && { sort, order }),
        },
      });
      setRows(data.data);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, priority, sort, order]);

  // Debounced load so typing in search doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  function onFilterChange(setter: (v: string) => void) {
    return (v: string) => {
      setPage(1);
      setter(v);
    };
  }

  function toggleSort(field: 'title' | 'plannedEnd') {
    setPage(1);
    if (sort === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setOrder('asc');
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Órdenes de Trabajo</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {meta.total} {meta.total === 1 ? 'orden' : 'órdenes'} en total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => load()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </Button>
          <Button onClick={() => navigate('/work-orders/create')}>
            <Plus className="h-4 w-4" />
            Nueva orden
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border shadow-xs mb-4">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            <input
              placeholder="Buscar por título, cliente, descripción..."
              value={search}
              onChange={(e) => onFilterChange(setSearch)(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-surface-secondary border border-border rounded-lg text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            <select
              value={status}
              onChange={(e) => onFilterChange(setStatus)(e.target.value)}
              className="pl-8 pr-8 py-2.5 text-sm bg-white border border-border rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-text-primary min-w-40"
            >
              <option value="">Todos los estados</option>
              {Object.values(WOStatus).map((s) => (
                <option key={s} value={s}>
                  {WO_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <select
            value={priority}
            onChange={(e) => onFilterChange(setPriority)(e.target.value)}
            className="px-3 py-2.5 text-sm bg-white border border-border rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-text-primary min-w-36"
          >
            <option value="">Toda prioridad</option>
            {Object.values(WOPriority).map((p) => (
              <option key={p} value={p}>
                {WO_PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th
                  className={`${thBase} cursor-pointer select-none hover:text-text-primary`}
                  onClick={() => toggleSort('title')}
                >
                  <div className="flex items-center gap-1">
                    Título
                    <SortIcon />
                  </div>
                </th>
                <th className={thBase} style={{ width: 140 }}>
                  <div className="flex items-center gap-1">Estado</div>
                </th>
                <th className={thBase} style={{ width: 120 }}>
                  <div className="flex items-center gap-1">Tipo</div>
                </th>
                <th className={thBase} style={{ width: 110 }}>
                  <div className="flex items-center gap-1">Prioridad</div>
                </th>
                <th className={thBase} style={{ width: 140 }}>
                  <div className="flex items-center gap-1">Cuadrilla</div>
                </th>
                <th
                  className={`${thBase} cursor-pointer select-none hover:text-text-primary`}
                  style={{ width: 130 }}
                  onClick={() => toggleSort('plannedEnd')}
                >
                  <div className="flex items-center gap-1">
                    Vence
                    <SortIcon />
                  </div>
                </th>
                <th className={thBase} style={{ width: 90 }}>
                  <div className="flex items-center gap-1">Horas est.</div>
                </th>
                <th className={thBase} style={{ width: 80 }}>
                  <div className="flex items-center gap-1" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16">
                    <div className="flex justify-center">
                      <Spinner className="h-6 w-6" />
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-text-muted text-sm">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 bg-surface-secondary rounded-full flex items-center justify-center">
                        <Search className="h-6 w-6 text-text-muted" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">Sin resultados</p>
                        <p className="text-text-muted text-xs mt-1">
                          Probá ajustando los filtros de búsqueda
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((wo) => (
                  <tr
                    key={wo.id}
                    onClick={() => navigate(`/work-orders/${wo.id}`)}
                    className="hover:bg-surface-secondary transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-text-primary">{wo.title}</p>
                      <p className="text-xs text-text-muted mt-0.5">{wo.code}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={WO_STATUS_TONE[wo.status]}>{WO_STATUS_LABEL[wo.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {WO_TYPE_LABEL[wo.type] ?? wo.type}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={WO_PRIORITY_TONE[wo.priority]}>
                        {WO_PRIORITY_LABEL[wo.priority]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {wo.assignedCrewName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {formatDate(wo.plannedEnd)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {wo.estimatedHours != null ? `${formatNumber(wo.estimatedHours)} h` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="h-4 w-4 text-text-muted inline-block" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={meta.page}
          lastPage={meta.lastPage}
          total={meta.total}
          onPage={setPage}
        />
      </div>
    </div>
  );
}
