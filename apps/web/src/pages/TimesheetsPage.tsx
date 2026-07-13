import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Plus, RefreshCw, Search, Info, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';

interface TimesheetRow {
  id: string;
  date: string;
  hours: number;
  overtimeHours: number;
  description: string | null;
  hourlyRate: number;
  totalCost: number;
  workOrder: { id: string; title: string; code: string } | null;
  worker: { id: string; name: string; role: string | null } | null;
  createdAt: string;
}

interface WorkerOption {
  id: string;
  name: string;
  role: string | null;
  hourlyRate: number | null;
  crew: { id: string; name: string } | null;
}

interface WorkOrderOption {
  id: string;
  code: string;
  title: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

const LIMIT = 20;

const emptyForm = {
  workerId: '',
  workOrderId: '',
  date: new Date().toISOString().slice(0, 10),
  hours: '8',
  overtimeHours: '',
  description: '',
};

export default function TimesheetsPage() {
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: LIMIT, lastPage: 1 });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workers, setWorkers] = useState<WorkerOption[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderOption[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/timesheets', { params: { page, limit: LIMIT } });
      setRows(data.data);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  // Client-side filtering (backend list endpoint doesn't accept a search param).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const worker = r.worker?.name?.toLowerCase() ?? '';
      const wo = `${r.workOrder?.code ?? ''} ${r.workOrder?.title ?? ''}`.toLowerCase();
      return worker.includes(q) || wo.includes(q);
    });
  }, [rows, search]);

  const totalHours = useMemo(
    () => rows.reduce((acc, r) => acc + (r.hours ?? 0) + (r.overtimeHours ?? 0), 0),
    [rows],
  );

  async function openModal() {
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
    try {
      const [w, wo] = await Promise.all([
        api.get('/timesheets/workers'),
        api.get('/work-orders', { params: { page: 1, limit: 100 } }),
      ]);
      setWorkers(w.data);
      setWorkOrders(
        (wo.data.data ?? []).map((o: { id: string; code: string; title: string }) => ({
          id: o.id,
          code: o.code,
          title: o.title,
        })),
      );
    } catch {
      // options fetch failure is non-fatal; the selects will simply be empty
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.workerId || !form.workOrderId || !form.date || !form.hours) {
      setError('Completá trabajador, orden, fecha y horas.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/timesheets', {
        workerId: form.workerId,
        workOrderId: form.workOrderId,
        date: form.date,
        hours: Number(form.hours),
        ...(form.overtimeHours ? { overtimeHours: Number(form.overtimeHours) } : {}),
        ...(form.description ? { description: form.description } : {}),
      });
      setModalOpen(false);
      setPage(1);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo registrar el parte de horas.'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('¿Eliminar este registro de horas?')) return;
    try {
      await api.delete(`/timesheets/${id}`);
      await load();
    } catch (err) {
      window.alert(apiErrorMessage(err, 'No se pudo eliminar el registro.'));
    }
  }

  const selectedWorker = workers.find((w) => w.id === form.workerId);

  return (
    <div className="p-6 flex-1">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Parte de Horas</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {meta.total} registro{meta.total === 1 ? '' : 's'} · Total:{' '}
            <strong>{formatNumber(totalHours)}h</strong>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="secondary" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={openModal}>
            <Plus className="h-4 w-4" />
            Registrar horas
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Registrá las horas trabajadas por orden para calcular costos reales de mano de obra. El
          costo se calcula automáticamente usando la tarifa del trabajador.
        </p>
      </div>

      <Card className="mb-4 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <Input
            placeholder="Buscar por trabajador u orden..."
            className="pl-9 bg-surface-secondary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <THead>
            <TR className="bg-surface-secondary hover:bg-surface-secondary">
              <TH style={{ width: 110 }}>Fecha</TH>
              <TH>Trabajador</TH>
              <TH>Orden de trabajo</TH>
              <TH style={{ width: 110 }}>Horas</TH>
              <TH style={{ width: 130 }}>Costo</TH>
              <TH>Descripción</TH>
              <TH style={{ width: 60 }} />
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16">
                  <div className="flex justify-center">
                    <Spinner className="h-6 w-6" />
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-text-muted text-sm">
                  <div className="flex flex-col items-center gap-3">
                    <Clock className="h-10 w-10 text-text-muted" />
                    <div>
                      <p className="font-medium text-text-primary">Sin registros de horas</p>
                      <p className="text-xs text-text-muted mt-1">
                        Registrá el tiempo trabajado en cada orden
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <TR key={r.id}>
                  <TD className="text-text-secondary">{formatDate(r.date)}</TD>
                  <TD className="font-medium">{r.worker?.name ?? '—'}</TD>
                  <TD>
                    {r.workOrder ? (
                      <span>
                        <span className="text-text-muted">{r.workOrder.code}</span>{' '}
                        {r.workOrder.title}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TD>
                  <TD>
                    {formatNumber(r.hours)}
                    {r.overtimeHours > 0 && (
                      <span className="text-text-muted"> +{formatNumber(r.overtimeHours)} extra</span>
                    )}
                  </TD>
                  <TD className="font-medium">{formatCurrency(r.totalCost)}</TD>
                  <TD className="text-text-secondary max-w-xs truncate whitespace-normal">
                    {r.description || '—'}
                  </TD>
                  <TD>
                    <button
                      onClick={() => remove(r.id)}
                      className="p-1.5 rounded-md text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
        <Pagination
          page={meta.page}
          lastPage={meta.lastPage}
          total={meta.total}
          onPage={setPage}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar horas"
        description="Cargá las horas trabajadas por un operario en una orden."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form="timesheet-form" disabled={saving}>
              {saving && <Spinner className="h-4 w-4" />}
              Registrar
            </Button>
          </>
        }
      >
        <form id="timesheet-form" onSubmit={submit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <Field label="Trabajador" required>
            <Select
              value={form.workerId}
              onChange={(e) => setForm((f) => ({ ...f, workerId: e.target.value }))}
            >
              <option value="">Seleccioná un trabajador</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                  {w.crew ? ` · ${w.crew.name}` : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Orden de trabajo" required>
            <Select
              value={form.workOrderId}
              onChange={(e) => setForm((f) => ({ ...f, workOrderId: e.target.value }))}
            >
              <option value="">Seleccioná una orden</option>
              {workOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} · {o.title}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Fecha" required>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </Field>
            <Field label="Horas" required>
              <Input
                type="number"
                min={0.5}
                max={24}
                step={0.5}
                value={form.hours}
                onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
              />
            </Field>
            <Field label="Horas extra">
              <Input
                type="number"
                min={0}
                step={0.5}
                value={form.overtimeHours}
                onChange={(e) => setForm((f) => ({ ...f, overtimeHours: e.target.value }))}
              />
            </Field>
          </div>
          {selectedWorker?.hourlyRate != null && (
            <p className="text-xs text-text-muted">
              Tarifa del trabajador: {formatCurrency(selectedWorker.hourlyRate)}/h
            </p>
          )}
          <Field label="Descripción">
            <Textarea
              rows={3}
              placeholder="Tarea realizada (opcional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
