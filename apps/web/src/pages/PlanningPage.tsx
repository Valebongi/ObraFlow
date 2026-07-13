import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';
import { WOStatus, type WorkOrderSummary } from '@obraflow/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { WO_STATUS_LABEL, WO_STATUS_TONE } from '@/lib/labels';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DOT_TONE: Record<string, string> = {
  gray: 'bg-gray-400',
  yellow: 'bg-amber-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
};

function ymdKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export default function PlanningPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<WorkOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/work-orders', { params: { page: 1, limit: 100 } });
      setOrders(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Bucket orders by scheduled day (plannedStart). Orders without a date are "unscheduled".
  const { byDay, unscheduled } = useMemo(() => {
    const map = new Map<string, WorkOrderSummary[]>();
    const none: WorkOrderSummary[] = [];
    for (const o of orders) {
      if (!o.plannedStart) {
        none.push(o);
        continue;
      }
      const key = ymdKey(new Date(o.plannedStart));
      const arr = map.get(key) ?? [];
      arr.push(o);
      map.set(key, arr);
    }
    return { byDay: map, unscheduled: none };
  }, [orders]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = ymdKey(new Date());

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedOrders = selected ? byDay.get(selected) ?? [] : [];

  function prevMonth() {
    setCursor(new Date(year, month - 1, 1));
    setSelected(null);
  }
  function nextMonth() {
    setCursor(new Date(year, month + 1, 1));
    setSelected(null);
  }

  return (
    <div className="p-6 flex-1">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-text-primary">Planificación</h1>
        <Button onClick={() => navigate('/work-orders')}>
          <Plus className="h-4 w-4" />
          Nueva orden
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl border border-border shadow-xs p-5">
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-text-primary transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-semibold text-text-primary">
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-text-primary transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-2xs font-semibold text-text-muted uppercase py-2"
                >
                  {d}
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner className="h-6 w-6" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, idx) => {
                  if (day === null) return <div key={`e${idx}`} />;
                  const key = ymdKey(new Date(year, month, day));
                  const dayOrders = byDay.get(key) ?? [];
                  const isToday = key === todayKey;
                  const isSelected = key === selected;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelected(isSelected ? null : key)}
                      className={`min-h-[60px] p-1.5 rounded-lg text-left transition-all ${
                        isSelected ? 'bg-brand-light ring-1 ring-brand' : 'hover:bg-surface-secondary'
                      }`}
                    >
                      <span
                        className={`text-xs font-semibold inline-flex h-5 w-5 items-center justify-center rounded-full mb-1 ${
                          isToday ? 'bg-dark text-brand' : 'text-text-primary'
                        }`}
                      >
                        {day}
                      </span>
                      <div className="space-y-0.5">
                        {dayOrders.slice(0, 3).map((o) => (
                          <div
                            key={o.id}
                            className="flex items-center gap-1 text-2xs text-text-secondary truncate"
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                                DOT_TONE[WO_STATUS_TONE[o.status]] ?? 'bg-gray-400'
                              }`}
                            />
                            <span className="truncate">{o.title}</span>
                          </div>
                        ))}
                        {dayOrders.length > 3 && (
                          <p className="text-2xs text-text-muted">+{dayOrders.length - 3} más</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {selected ? (
            <div className="bg-white rounded-xl border border-border shadow-xs p-4">
              <h3 className="font-semibold text-text-primary mb-3">
                Órdenes del {formatSelectedLabel(selected)}
              </h3>
              {selectedOrders.length === 0 ? (
                <p className="text-sm text-text-muted">No hay órdenes para este día</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedOrders.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => navigate('/work-orders')}
                      className="w-full text-left rounded-lg border border-border p-3 hover:bg-surface-secondary transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-2xs text-text-muted">{o.code}</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium ${statusPill(
                            o.status,
                          )}`}
                        >
                          {WO_STATUS_LABEL[o.status]}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-text-primary mt-1 truncate">
                        {o.title}
                      </p>
                      {o.clientName && (
                        <p className="text-xs text-text-muted mt-0.5 truncate">{o.clientName}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border shadow-xs p-4 text-center text-sm text-text-muted">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-text-muted" />
              Seleccioná un día para ver sus órdenes
            </div>
          )}

          <div className="bg-white rounded-xl border border-border shadow-xs p-4">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className="h-2 w-2 bg-amber-500 rounded-full" />
              Sin fecha programada ({unscheduled.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {unscheduled.length === 0 ? (
                <p className="text-sm text-text-muted">Todas las órdenes tienen fecha</p>
              ) : (
                unscheduled.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => navigate('/work-orders')}
                    className="w-full text-left rounded-lg border border-border p-3 hover:bg-surface-secondary transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-2xs text-text-muted">{o.code}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium ${statusPill(
                          o.status,
                        )}`}
                      >
                        {WO_STATUS_LABEL[o.status]}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-text-primary mt-1 truncate">{o.title}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatSelectedLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return `${d} de ${MONTHS[m - 1]}`;
}

function statusPill(status: WOStatus): string {
  const tone = WO_STATUS_TONE[status];
  const map: Record<string, string> = {
    gray: 'bg-surface-tertiary text-text-secondary',
    yellow: 'bg-amber-100 text-amber-700',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
  };
  return map[tone] ?? map.gray;
}
