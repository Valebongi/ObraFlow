import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  Clock,
  Building2,
  MapPin,
  HardHat,
  RefreshCw,
} from 'lucide-react';
import { WOStatus, WOPriority, WOType, WO_STATUS_TRANSITIONS } from '@obraflow/shared';
import { api, apiErrorMessage } from '@/lib/api';
import {
  WO_STATUS_LABEL,
  WO_STATUS_TONE,
  WO_PRIORITY_LABEL,
  WO_PRIORITY_TONE,
  WO_TYPE_LABEL,
} from '@/lib/labels';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';

interface Named {
  id: string;
  name: string;
}
interface Timesheet {
  id: string;
  date: string;
  hoursNormal: number;
  hoursExtra: number;
  totalCost: number;
  worker?: { id: string; name: string; role?: string };
}
interface WOMaterial {
  id: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  material?: { id: string; name: string; code?: string; unit?: string };
}
interface Incident {
  id: string;
  type: string;
  description: string;
  severity: string;
  reportedAt: string;
}
interface WorkOrder {
  id: string;
  code: string;
  title: string;
  description?: string;
  status: WOStatus;
  priority: WOPriority;
  type: WOType;
  plannedStart?: string;
  plannedEnd?: string;
  estimatedHours?: number;
  estimatedCost?: number;
  costTotal?: number;
  notes?: string;
  client?: Named | null;
  location?: Named | null;
  crew?: (Named & { leader?: { name: string } | null }) | null;
  timesheets?: Timesheet[];
  materials?: WOMaterial[];
  incidents?: Incident[];
}

const SEVERITY_TONE: Record<string, 'gray' | 'yellow' | 'orange' | 'red'> = {
  LOW: 'gray',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red',
};

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon?: typeof Building2;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </p>
      <p className="text-sm text-text-primary">{children}</p>
    </div>
  );
}

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [changing, setChanging] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/work-orders/${id}`);
      setWo(data);
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo cargar la orden de trabajo'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(status: WOStatus) {
    if (!id) return;
    setChanging(true);
    setError('');
    try {
      await api.patch(`/work-orders/${id}/status`, { status });
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo cambiar el estado'));
    } finally {
      setChanging(false);
    }
  }

  if (loading) return <PageLoader />;

  if (error && !wo) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <EmptyState icon={AlertTriangle} title="Error" description={error} />
      </div>
    );
  }

  if (!wo) return null;

  const transitions = WO_STATUS_TRANSITIONS[wo.status] ?? [];
  const materials = wo.materials ?? [];
  const incidents = wo.incidents ?? [];
  const timesheets = wo.timesheets ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate('/work-orders')}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-tertiary transition-colors mt-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-text-muted">{wo.code}</span>
              <Badge tone={WO_STATUS_TONE[wo.status]}>{WO_STATUS_LABEL[wo.status]}</Badge>
              <Badge tone={WO_PRIORITY_TONE[wo.priority]}>{WO_PRIORITY_LABEL[wo.priority]}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mt-1">{wo.title}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="secondary" onClick={() => load()} disabled={changing}>
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar
            </Button>
            {transitions.map((target, i) => (
              <Button
                key={target}
                variant={i === 0 ? 'primary' : 'secondary'}
                disabled={changing}
                onClick={() => changeStatus(target)}
              >
                {WO_STATUS_LABEL[target]}
              </Button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Details */}
        <Card>
          <CardBody className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Detail icon={Building2} label="Cliente">
              {wo.client?.name ?? '—'}
            </Detail>
            <Detail icon={MapPin} label="Ubicación">
              {wo.location?.name ?? '—'}
            </Detail>
            <Detail label="Tipo">{WO_TYPE_LABEL[wo.type] ?? wo.type}</Detail>
            <Detail label="Prioridad">{WO_PRIORITY_LABEL[wo.priority]}</Detail>
            <Detail icon={HardHat} label="Cuadrilla">
              {wo.crew?.name ?? '—'}
            </Detail>
            <Detail label="Inicio programado">{formatDate(wo.plannedStart)}</Detail>
            <Detail label="Fin programado">{formatDate(wo.plannedEnd)}</Detail>
            <Detail label="Horas estimadas">
              {wo.estimatedHours != null ? `${formatNumber(wo.estimatedHours)} h` : '—'}
            </Detail>
            <Detail label="Costo estimado">{formatCurrency(wo.estimatedCost)}</Detail>
            <Detail label="Costo total">{formatCurrency(wo.costTotal)}</Detail>
          </CardBody>
        </Card>

        {/* Description */}
        {wo.description && (
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-text-primary">Descripción</h2>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{wo.description}</p>
            </CardBody>
          </Card>
        )}

        {/* Materiales */}
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Package className="h-4 w-4 text-text-muted" />
            <h2 className="text-base font-semibold text-text-primary">Materiales</h2>
            <span className="text-xs text-text-muted">({materials.length})</span>
          </CardHeader>
          {materials.length === 0 ? (
            <EmptyState icon={Package} title="Sin materiales" description="No se registraron materiales en esta orden." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-surface-secondary">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-2xs font-semibold text-text-secondary uppercase tracking-wider">Material</th>
                    <th className="text-left px-4 py-2.5 text-2xs font-semibold text-text-secondary uppercase tracking-wider">Cantidad</th>
                    <th className="text-left px-4 py-2.5 text-2xs font-semibold text-text-secondary uppercase tracking-wider">Costo unit.</th>
                    <th className="text-right px-4 py-2.5 text-2xs font-semibold text-text-secondary uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {materials.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {m.material?.name ?? '—'}
                        {m.material?.code && (
                          <span className="text-xs text-text-muted ml-1">({m.material.code})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {formatNumber(m.quantity)} {m.material?.unit ?? ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{formatCurrency(m.unitCost)}</td>
                      <td className="px-4 py-3 text-sm text-text-primary text-right">{formatCurrency(m.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Incidencias */}
        <Card>
          <CardHeader className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-text-muted" />
            <h2 className="text-base font-semibold text-text-primary">Incidencias</h2>
            <span className="text-xs text-text-muted">({incidents.length})</span>
          </CardHeader>
          {incidents.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="Sin incidencias" description="No se reportaron incidencias en esta orden." />
          ) : (
            <CardBody className="space-y-3">
              {incidents.map((inc) => (
                <div key={inc.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{inc.type}</span>
                      <Badge tone={SEVERITY_TONE[inc.severity] ?? 'gray'}>{inc.severity}</Badge>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{inc.description}</p>
                  </div>
                  <span className="text-xs text-text-muted whitespace-nowrap">{formatDate(inc.reportedAt)}</span>
                </div>
              ))}
            </CardBody>
          )}
        </Card>

        {/* Partes de horas */}
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-text-muted" />
            <h2 className="text-base font-semibold text-text-primary">Partes de horas</h2>
            <span className="text-xs text-text-muted">({timesheets.length})</span>
          </CardHeader>
          {timesheets.length === 0 ? (
            <EmptyState icon={Clock} title="Sin partes de horas" description="No se registraron horas en esta orden." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-surface-secondary">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-2xs font-semibold text-text-secondary uppercase tracking-wider">Trabajador</th>
                    <th className="text-left px-4 py-2.5 text-2xs font-semibold text-text-secondary uppercase tracking-wider">Fecha</th>
                    <th className="text-left px-4 py-2.5 text-2xs font-semibold text-text-secondary uppercase tracking-wider">H. normales</th>
                    <th className="text-left px-4 py-2.5 text-2xs font-semibold text-text-secondary uppercase tracking-wider">H. extra</th>
                    <th className="text-right px-4 py-2.5 text-2xs font-semibold text-text-secondary uppercase tracking-wider">Costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {timesheets.map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-3 text-sm text-text-primary">{t.worker?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(t.date)}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{formatNumber(t.hoursNormal)}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{formatNumber(t.hoursExtra)}</td>
                      <td className="px-4 py-3 text-sm text-text-primary text-right">{formatCurrency(t.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
