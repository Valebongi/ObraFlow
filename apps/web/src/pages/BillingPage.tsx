import { useCallback, useEffect, useState } from 'react';
import { CreditCard, CircleCheckBig, Info, Loader2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';

interface BillingStatus {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd?: boolean;
  stripeEnabled: boolean;
}

interface PlanDef {
  id: string;
  name: string;
  price: string;
  priceSuffix?: string;
  features: string[];
}

const PLANS: PlanDef[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: 'Gratis',
    features: ['Hasta 50 OTs/mes', '5 usuarios', 'Módulos CRUD básicos', 'Reportes CSV'],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '$49',
    priceSuffix: '/mes',
    features: [
      'OTs ilimitadas',
      'Usuarios ilimitados',
      'Portal de clientes',
      'Exportación PDF',
      'Notificaciones por email',
      'Reportes avanzados',
      'Soporte prioritario',
    ],
  },
];

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Activo', className: 'text-green-700 bg-green-50' },
  TRIALING: { label: 'Prueba', className: 'text-blue-700 bg-blue-50' },
  PAST_DUE: { label: 'Pago vencido', className: 'text-red-700 bg-red-50' },
  CANCELED: { label: 'Cancelado', className: 'text-gray-600 bg-gray-100' },
};

export default function BillingPage() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<BillingStatus>('/billing/status');
      setStatus(data);
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo cargar la información de facturación'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function upgrade() {
    setActing(true);
    setError('');
    try {
      const { data } = await api.post<{ url: string }>('/billing/create-checkout-session', {
        successUrl: `${window.location.origin}/billing?checkout=success`,
        cancelUrl: `${window.location.origin}/billing?checkout=cancel`,
      });
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo iniciar el checkout'));
      setActing(false);
    }
  }

  async function manage() {
    setActing(true);
    setError('');
    try {
      const { data } = await api.post<{ url: string }>('/billing/create-portal-session', {
        returnUrl: `${window.location.origin}/billing`,
      });
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo abrir el portal de facturación'));
      setActing(false);
    }
  }

  const currentPlan = (status?.plan ?? 'STARTER').toUpperCase();
  const statusMeta = STATUS_LABEL[status?.status ?? 'ACTIVE'] ?? STATUS_LABEL.ACTIVE;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="text-gray-500 text-sm mt-1">Administrá tu plan y suscripción</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-text-muted">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current plan */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  Plan actual
                </h2>
                <span
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusMeta.className}`}
                >
                  <CircleCheckBig className="w-3 h-3" /> {statusMeta.label}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-extrabold text-gray-900 tracking-tight">{currentPlan}</span>
              </div>
              {status?.currentPeriodEnd && (
                <p className="text-sm text-gray-500">
                  {status.cancelAtPeriodEnd ? 'Finaliza el ' : 'Se renueva el '}
                  {new Date(status.currentPeriodEnd).toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>

            {/* Plan options */}
            <div className="grid grid-cols-2 gap-3">
              {PLANS.map((plan) => {
                const isCurrent = plan.id === currentPlan;
                const checkClass = isCurrent ? 'text-gray-300' : 'text-green-500';
                return (
                  <div
                    key={plan.id}
                    className={`rounded-xl border-2 p-5 transition-all ${
                      isCurrent ? 'bg-white border-[#F5C518]' : 'bg-gray-50/50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900">{plan.name}</h3>
                      {isCurrent && (
                        <span className="text-xs bg-[#F5C518] text-black font-bold px-2 py-0.5 rounded-full">
                          Actual
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-extrabold text-gray-900 mb-4">
                      {plan.price}
                      {plan.priceSuffix && (
                        <span className="text-sm font-normal text-gray-500">{plan.priceSuffix}</span>
                      )}
                    </p>
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-sm text-gray-600">
                          <CircleCheckBig className={`w-3.5 h-3.5 ${checkClass} flex-shrink-0 mt-0.5`} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {status?.stripeEnabled && !isCurrent && plan.id === 'PRO' && (
                      <button
                        onClick={upgrade}
                        disabled={acting}
                        className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand text-dark hover:bg-brand-hover shadow-brand font-medium h-9 px-3 text-sm transition-all disabled:opacity-50"
                      >
                        {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Actualizar a ${plan.name}`}
                      </button>
                    )}
                    {status?.stripeEnabled && isCurrent && plan.id === 'PRO' && (
                      <button
                        onClick={manage}
                        disabled={acting}
                        className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white text-text-primary border border-border hover:bg-surface-secondary font-medium h-9 px-3 text-sm transition-all disabled:opacity-50"
                      >
                        {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gestionar suscripción'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
            )}

            {/* Stripe not configured banner */}
            {!status?.stripeEnabled && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  Billing no configurado en este entorno. Configurá{' '}
                  <code className="bg-amber-100 border border-amber-200 rounded px-1 text-xs font-mono">
                    STRIPE_SECRET_KEY
                  </code>{' '}
                  en el archivo{' '}
                  <code className="bg-amber-100 border border-amber-200 rounded px-1 text-xs font-mono">.env</code>{' '}
                  para activarlo.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
