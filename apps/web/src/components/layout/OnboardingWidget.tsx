import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, Circle, ChevronDown, X } from 'lucide-react';
import { api } from '@/lib/api';

const DISMISS_KEY = 'onboarding_dismissed';

interface Step {
  key: string;
  title: string;
  description: string;
  to: string;
  done: boolean;
}

export function OnboardingWidget() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const [collapsed, setCollapsed] = useState(false);
  const [counts, setCounts] = useState({ clients: 0, workers: 0, workOrders: 0 });

  useEffect(() => {
    if (dismissed) return;
    api
      .get('/organization/stats')
      .then(({ data }) =>
        setCounts({
          clients: data.totalClients ?? data.clients ?? 0,
          workers: data.totalWorkers ?? data.workers ?? 0,
          workOrders: data.totalWorkOrders ?? data.workOrders ?? 0,
        }),
      )
      .catch(() => {});
  }, [dismissed]);

  if (dismissed) return null;

  const steps: Step[] = [
    { key: 'account', title: 'Creaste tu cuenta', description: '', to: '#', done: true },
    {
      key: 'client',
      title: 'Agregá tu primer cliente',
      description: 'Los clientes son los dueños de las OTs.',
      to: '/clients',
      done: counts.clients > 0,
    },
    {
      key: 'worker',
      title: 'Sumá un operario',
      description: 'Los operarios ejecutan las órdenes de trabajo.',
      to: '/workers',
      done: counts.workers > 0,
    },
    {
      key: 'wo',
      title: 'Creá tu primera OT',
      description: 'La orden de trabajo es el corazón de ObraFlow.',
      to: '/work-orders/create',
      done: counts.workOrders > 0,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <div className="fixed bottom-5 right-5 z-40 w-80 rounded-xl bg-dark text-white shadow-2xl border border-dark-muted overflow-hidden">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold">Comenzar con ObraFlow</p>
          <p className="text-xs text-gray-400">
            {completed} de {steps.length} completados
          </p>
        </div>
        <div className="flex items-center gap-1">
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              localStorage.setItem(DISMISS_KEY, '1');
              setDismissed(true);
            }}
            className="p-0.5 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </span>
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4">
          <div className="h-1 w-full rounded-full bg-white/10 mb-4">
            <div className="h-1 rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
          </div>

          <div className="space-y-3">
            {steps.map((step) => (
              <Link
                key={step.key}
                to={step.to}
                className="flex items-start gap-3 group"
              >
                {step.done ? (
                  <CircleCheck className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      step.done ? 'text-gray-500 line-through' : 'text-white group-hover:text-brand'
                    }`}
                  >
                    {step.title}
                  </p>
                  {step.description && !step.done && (
                    <p className="text-xs text-gray-400 truncate">{step.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <button
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, '1');
              setDismissed(true);
            }}
            className="w-full mt-4 text-center text-xs text-gray-400 hover:text-white transition-colors"
          >
            Ya sé lo que hago — cerrar guía
          </button>
        </div>
      )}
    </div>
  );
}
