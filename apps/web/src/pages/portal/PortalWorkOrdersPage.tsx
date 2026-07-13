import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, MapPin, Calendar, ChevronRight } from 'lucide-react';
import type { WOStatus } from '@obraflow/shared';
import { portalApi } from '@/lib/portalApi';
import { WO_STATUS_LABEL, WO_STATUS_TONE, WO_PRIORITY_LABEL } from '@/lib/labels';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';

interface PortalWorkOrder {
  id: string;
  code: string;
  title: string;
  status: WOStatus;
  priority: keyof typeof WO_PRIORITY_LABEL;
  plannedStart: string | null;
  plannedEnd: string | null;
  location: { name: string; address: string | null } | null;
  crew: { name: string } | null;
  createdAt: string;
}

export default function PortalWorkOrdersPage() {
  const [rows, setRows] = useState<PortalWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await portalApi.get('/portal/work-orders', {
        params: { page: 1, limit: 50 },
      });
      setRows(data.data);
    } catch {
      setError('No pudimos cargar tus órdenes de trabajo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Órdenes de trabajo</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Seguí el estado y el avance de tus obras.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl bg-white border border-border">
          <EmptyState
            icon={ClipboardList}
            title="Sin órdenes de trabajo"
            description="Todavía no hay órdenes de trabajo asociadas a tu cuenta."
          />
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((wo) => (
            <Link
              key={wo.id}
              to={`/portal/work-orders/${wo.id}`}
              className="group rounded-xl bg-white border border-border p-5 hover:border-brand hover:shadow-brand transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-text-muted">{wo.code}</span>
                    <Badge tone={WO_STATUS_TONE[wo.status]}>{WO_STATUS_LABEL[wo.status]}</Badge>
                  </div>
                  <h3 className="mt-1.5 text-base font-semibold text-text-primary truncate">
                    {wo.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
                    {wo.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-text-muted" />
                        {wo.location.name}
                      </span>
                    )}
                    {wo.plannedStart && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-text-muted" />
                        {formatDate(wo.plannedStart)}
                        {wo.plannedEnd ? ` – ${formatDate(wo.plannedEnd)}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-text-muted group-hover:text-brand-dark transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
