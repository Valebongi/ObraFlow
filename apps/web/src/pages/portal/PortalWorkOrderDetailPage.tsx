import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Users,
  Calendar,
  CalendarCheck,
  AlertTriangle,
} from 'lucide-react';
import type { WOStatus } from '@obraflow/shared';
import { portalApi } from '@/lib/portalApi';
import {
  WO_STATUS_LABEL,
  WO_STATUS_TONE,
  WO_PRIORITY_LABEL,
  WO_TYPE_LABEL,
} from '@/lib/labels';
import { formatDate, formatDateTime } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';

interface StatusLog {
  id: string;
  fromStatus: WOStatus | null;
  toStatus: WOStatus;
  reason: string | null;
  changedAt: string;
}

interface Incident {
  id: string;
  type: string;
  description: string;
  severity: string;
  reportedAt: string;
}

interface WorkOrderDetail {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: WOStatus;
  priority: keyof typeof WO_PRIORITY_LABEL;
  type: keyof typeof WO_TYPE_LABEL;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  location: { name: string; address: string | null } | null;
  crew: { name: string; code: string } | null;
  statusLogs: StatusLog[];
  incidents: Incident[];
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
        <Icon className="h-4 w-4 text-text-muted" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}

export default function PortalWorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [wo, setWo] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await portalApi.get(`/portal/work-orders/${id}`);
      setWo(data);
    } catch {
      setError('No pudimos cargar esta orden de trabajo.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader />;

  if (error || !wo) {
    return (
      <div>
        <Link
          to="/portal/work-orders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <div className="mt-4 rounded-xl bg-white border border-border">
          <EmptyState
            icon={AlertTriangle}
            title="Orden no disponible"
            description={error || 'No encontramos esta orden de trabajo.'}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/portal/work-orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a órdenes
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-text-muted">{wo.code}</span>
            <Badge tone={WO_STATUS_TONE[wo.status]}>{WO_STATUS_LABEL[wo.status]}</Badge>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-text-primary">{wo.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="gray">{WO_PRIORITY_LABEL[wo.priority]}</Badge>
          <Badge tone="gray">{WO_TYPE_LABEL[wo.type]}</Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <section className="rounded-xl bg-white border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary">Descripción</h2>
            <p className="mt-2 text-sm text-text-secondary whitespace-pre-line">
              {wo.description || 'Sin descripción.'}
            </p>
          </section>

          {/* Timeline */}
          <section className="rounded-xl bg-white border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary">Historial de estados</h2>
            {wo.statusLogs.length === 0 ? (
              <p className="mt-2 text-sm text-text-secondary">Sin movimientos registrados.</p>
            ) : (
              <ol className="mt-4 space-y-4">
                {wo.statusLogs.map((log) => (
                  <li key={log.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand" />
                      <span className="flex-1 w-px bg-border" />
                    </div>
                    <div className="pb-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={WO_STATUS_TONE[log.toStatus]}>
                          {WO_STATUS_LABEL[log.toStatus]}
                        </Badge>
                        <span className="text-xs text-text-muted">
                          {formatDateTime(log.changedAt)}
                        </span>
                      </div>
                      {log.reason && (
                        <p className="mt-1 text-sm text-text-secondary">{log.reason}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Incidents */}
          {wo.incidents.length > 0 && (
            <section className="rounded-xl bg-white border border-border p-5">
              <h2 className="text-sm font-semibold text-text-primary">Incidencias</h2>
              <ul className="mt-3 space-y-3">
                {wo.incidents.map((inc) => (
                  <li
                    key={inc.id}
                    className="flex items-start gap-3 rounded-lg bg-surface-secondary p-3"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{inc.type}</p>
                      <p className="text-sm text-text-secondary">{inc.description}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {formatDateTime(inc.reportedAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <section className="rounded-xl bg-white border border-border p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text-primary">Detalles</h2>
            {wo.location && (
              <InfoRow
                icon={MapPin}
                label="Ubicación"
                value={
                  <>
                    {wo.location.name}
                    {wo.location.address && (
                      <span className="block text-xs font-normal text-text-secondary">
                        {wo.location.address}
                      </span>
                    )}
                  </>
                }
              />
            )}
            {wo.crew && <InfoRow icon={Users} label="Cuadrilla" value={wo.crew.name} />}
            <InfoRow
              icon={Calendar}
              label="Planificado"
              value={
                wo.plannedStart
                  ? `${formatDate(wo.plannedStart)}${
                      wo.plannedEnd ? ` – ${formatDate(wo.plannedEnd)}` : ''
                    }`
                  : 'Sin fecha'
              }
            />
            <InfoRow
              icon={CalendarCheck}
              label="Ejecución real"
              value={
                wo.actualStart
                  ? `${formatDate(wo.actualStart)}${
                      wo.actualEnd ? ` – ${formatDate(wo.actualEnd)}` : ''
                    }`
                  : 'No iniciada'
              }
            />
          </section>
        </div>
      </div>
    </div>
  );
}
