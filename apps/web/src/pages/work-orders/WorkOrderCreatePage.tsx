import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { WOType, WOPriority } from '@obraflow/shared';
import { api, apiErrorMessage } from '@/lib/api';
import { WO_TYPE_LABEL, WO_PRIORITY_LABEL } from '@/lib/labels';
import { Button } from '@/components/ui/Button';

interface Option {
  id: string;
  name: string;
}

// Draft autosave: the form is persisted to localStorage as you type, so you can
// leave to create a missing referenced record (client, crew, ...) and come back
// without losing what you already entered.
const DRAFT_KEY = 'obraflow:wo-create-draft';

interface WOForm {
  title: string;
  type: WOType;
  priority: WOPriority;
  description: string;
  clientId: string;
  crewId: string;
  locationId: string;
  contractId: string;
  plannedStart: string;
  plannedEnd: string;
  estimatedHours: string;
  estimatedCost: string;
  notes: string;
}

const DEFAULT_FORM: WOForm = {
  title: '',
  type: WOType.CORRECTIVE,
  priority: WOPriority.MEDIUM,
  description: '',
  clientId: '',
  crewId: '',
  locationId: '',
  contractId: '',
  plannedStart: '',
  plannedEnd: '',
  estimatedHours: '',
  estimatedCost: '',
  notes: '',
};

function loadDraft(): WOForm | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return { ...DEFAULT_FORM, ...(JSON.parse(raw) as Partial<WOForm>) };
  } catch {
    return null;
  }
}

function isDirty(f: WOForm): boolean {
  return JSON.stringify(f) !== JSON.stringify(DEFAULT_FORM);
}

const inputClass =
  'w-full px-3 py-2.5 text-sm bg-white border rounded-lg text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:bg-surface-secondary disabled:text-text-muted disabled:cursor-not-allowed transition-colors duration-150 border-border';

const selectClass =
  'w-full px-3 py-2.5 text-sm bg-white border rounded-lg text-text-primary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:bg-surface-secondary disabled:text-text-muted disabled:cursor-not-allowed transition-colors duration-150 pr-9 border-border';

function FieldWrap({
  label,
  htmlFor,
  action,
  children,
}: {
  label?: string;
  htmlFor?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={htmlFor} className="text-sm font-medium text-text-primary">
            {label}
          </label>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function CreateLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-xs font-medium text-brand-dark hover:underline"
    >
      <Plus className="h-3 w-3" />
      {children}
    </Link>
  );
}

function SelectChevron() {
  return (
    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export default function WorkOrderCreatePage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Option[]>([]);
  const [locations, setLocations] = useState<Option[]>([]);
  const [crews, setCrews] = useState<Option[]>([]);
  const [contracts, setContracts] = useState<Option[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<WOForm>(() => loadDraft() ?? DEFAULT_FORM);
  const [restored, setRestored] = useState(() => loadDraft() !== null);

  function set<K extends keyof WOForm>(key: K, value: WOForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Autosave the draft whenever the form changes (and clear it when empty).
  useEffect(() => {
    if (isDirty(form)) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } else {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [form]);

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setForm(DEFAULT_FORM);
    setRestored(false);
    setError('');
  }

  useEffect(() => {
    async function loadOptions() {
      const [c, l, cr, co] = await Promise.allSettled([
        api.get('/clients', { params: { limit: 100 } }),
        api.get('/locations', { params: { limit: 100 } }),
        api.get('/crews', { params: { limit: 100 } }),
        api.get('/contracts', { params: { limit: 100 } }),
      ]);
      if (c.status === 'fulfilled') setClients(c.value.data.data ?? []);
      if (l.status === 'fulfilled') setLocations(l.value.data.data ?? []);
      if (cr.status === 'fulfilled') setCrews(cr.value.data.data ?? []);
      if (co.status === 'fulfilled') setContracts(co.value.data.data ?? []);
    }
    loadOptions();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.title.trim().length < 3) {
      setError('El título debe tener al menos 3 caracteres');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        priority: form.priority,
        ...(form.description.trim() && { description: form.description.trim() }),
        ...(form.clientId && { clientId: form.clientId }),
        ...(form.locationId && { locationId: form.locationId }),
        ...(form.contractId && { contractId: form.contractId }),
        ...(form.crewId && { crewId: form.crewId }),
        ...(form.plannedStart && { plannedStart: new Date(form.plannedStart).toISOString() }),
        ...(form.plannedEnd && { plannedEnd: new Date(form.plannedEnd).toISOString() }),
        ...(form.estimatedHours && { estimatedHours: Number(form.estimatedHours) }),
        ...(form.estimatedCost && { estimatedCost: Number(form.estimatedCost) }),
        ...(form.notes.trim() && { notes: form.notes.trim() }),
      };
      const { data } = await api.post('/work-orders', payload);
      localStorage.removeItem(DRAFT_KEY);
      navigate(data?.id ? `/work-orders/${data.id}` : '/work-orders');
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo crear la orden de trabajo'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate('/work-orders')}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-tertiary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Nueva orden de trabajo</h1>
            <p className="text-sm text-text-muted mt-0.5">Completá los datos para crear la orden</p>
          </div>
        </div>

        {restored && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-brand/40 bg-brand-light px-4 py-3">
            <p className="text-sm text-brand-dark">
              Retomaste un borrador guardado — seguí donde lo dejaste.
            </p>
            <button
              type="button"
              onClick={discardDraft}
              className="text-sm font-medium text-brand-dark hover:underline whitespace-nowrap"
            >
              Descartar borrador
            </button>
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          {/* Información principal */}
          <div className="bg-white rounded-xl border border-border shadow-xs p-5">
            <h2 className="text-base font-semibold text-text-primary mb-4">Información principal</h2>
            <div className="space-y-4">
              <FieldWrap label="Título *" htmlFor="title">
                <div className="relative">
                  <input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    placeholder="Ej: Reparación de instalación eléctrica — Planta Norte"
                    className={inputClass}
                  />
                </div>
              </FieldWrap>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldWrap label="Tipo *" htmlFor="type">
                  <div className="relative">
                    <select
                      id="type"
                      name="type"
                      value={form.type}
                      onChange={(e) => set('type', e.target.value as WOType)}
                      className={selectClass}
                    >
                      {Object.values(WOType).map((t) => (
                        <option key={t} value={t}>
                          {WO_TYPE_LABEL[t]}
                        </option>
                      ))}
                    </select>
                    <SelectChevron />
                  </div>
                </FieldWrap>

                <FieldWrap label="Prioridad *" htmlFor="priority">
                  <div className="relative">
                    <select
                      id="priority"
                      name="priority"
                      value={form.priority}
                      onChange={(e) => set('priority', e.target.value as WOPriority)}
                      className={selectClass}
                    >
                      {Object.values(WOPriority).map((p) => (
                        <option key={p} value={p}>
                          {WO_PRIORITY_LABEL[p]}
                        </option>
                      ))}
                    </select>
                    <SelectChevron />
                  </div>
                </FieldWrap>
              </div>

              <FieldWrap label="Descripción" htmlFor="description">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Describí el trabajo a realizar, alcance, requerimientos especiales..."
                  className={`${inputClass} resize-none`}
                />
              </FieldWrap>
            </div>
          </div>

          {/* Asignación y programación */}
          <div className="bg-white rounded-xl border border-border shadow-xs p-5">
            <h2 className="text-base font-semibold text-text-primary mb-4">Asignación y programación</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldWrap
                  label="Cliente"
                  htmlFor="clientId"
                  action={<CreateLink to="/clients">Crear cliente</CreateLink>}
                >
                  <div className="relative">
                    <select
                      id="clientId"
                      name="clientId"
                      value={form.clientId}
                      onChange={(e) => set('clientId', e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Seleccioná cliente</option>
                      {clients.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                    <SelectChevron />
                  </div>
                </FieldWrap>

                <FieldWrap
                  label="Cuadrilla"
                  htmlFor="crewId"
                  action={<CreateLink to="/crews">Crear cuadrilla</CreateLink>}
                >
                  <div className="relative">
                    <select
                      id="crewId"
                      name="crewId"
                      value={form.crewId}
                      onChange={(e) => set('crewId', e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Asignar cuadrilla</option>
                      {crews.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                    <SelectChevron />
                  </div>
                </FieldWrap>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldWrap
                  label="Ubicación"
                  htmlFor="locationId"
                  action={<CreateLink to="/locations">Crear ubicación</CreateLink>}
                >
                  <div className="relative">
                    <select
                      id="locationId"
                      name="locationId"
                      value={form.locationId}
                      onChange={(e) => set('locationId', e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Seleccioná ubicación</option>
                      {locations.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                    <SelectChevron />
                  </div>
                </FieldWrap>

                <FieldWrap
                  label="Contrato"
                  htmlFor="contractId"
                  action={<CreateLink to="/contracts">Crear contrato</CreateLink>}
                >
                  <div className="relative">
                    <select
                      id="contractId"
                      name="contractId"
                      value={form.contractId}
                      onChange={(e) => set('contractId', e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Seleccioná contrato</option>
                      {contracts.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                    <SelectChevron />
                  </div>
                </FieldWrap>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldWrap label="Inicio programado" htmlFor="plannedStart">
                  <div className="relative">
                    <input
                      id="plannedStart"
                      name="plannedStart"
                      type="date"
                      value={form.plannedStart}
                      onChange={(e) => set('plannedStart', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </FieldWrap>

                <FieldWrap label="Fin programado" htmlFor="plannedEnd">
                  <div className="relative">
                    <input
                      id="plannedEnd"
                      name="plannedEnd"
                      type="date"
                      value={form.plannedEnd}
                      onChange={(e) => set('plannedEnd', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </FieldWrap>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldWrap label="Horas estimadas" htmlFor="estimatedHours">
                  <div className="relative">
                    <input
                      id="estimatedHours"
                      name="estimatedHours"
                      type="number"
                      min="0"
                      step="0.5"
                      value={form.estimatedHours}
                      onChange={(e) => set('estimatedHours', e.target.value)}
                      placeholder="Ej: 8"
                      className={inputClass}
                    />
                  </div>
                </FieldWrap>

                <FieldWrap label="Costo estimado ($)" htmlFor="estimatedCost">
                  <div className="relative">
                    <input
                      id="estimatedCost"
                      name="estimatedCost"
                      type="number"
                      min="0"
                      value={form.estimatedCost}
                      onChange={(e) => set('estimatedCost', e.target.value)}
                      placeholder="Ej: 50000"
                      className={inputClass}
                    />
                  </div>
                </FieldWrap>
              </div>
            </div>
          </div>

          {/* Notas adicionales */}
          <div className="bg-white rounded-xl border border-border shadow-xs p-5">
            <h2 className="text-base font-semibold text-text-primary mb-4">Notas adicionales</h2>
            <FieldWrap>
              <textarea
                name="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Notas internas, instrucciones especiales, contactos en sitio..."
                className={`${inputClass} resize-none`}
              />
            </FieldWrap>
          </div>

          {error && <p className="text-sm text-red-500 text-right">{error}</p>}

          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-xs text-text-muted">
              Se guarda un borrador automáticamente mientras completás.
            </p>
            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" size="lg" onClick={() => navigate('/work-orders')}>
                Cancelar
              </Button>
              <Button type="submit" size="lg" disabled={saving}>
                {saving ? 'Creando...' : 'Crear orden de trabajo'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
