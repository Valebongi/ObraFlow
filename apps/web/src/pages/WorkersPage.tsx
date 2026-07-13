import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, User, Plus, RefreshCw, Search, Pencil, Trash2 } from 'lucide-react';
import { WorkerStatus } from '@obraflow/shared';
import { api, apiErrorMessage } from '@/lib/api';
import { WORKER_STATUS_LABEL, WORKER_STATUS_TONE } from '@/lib/labels';
import { formatCurrency, initials } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';

interface WorkerRow {
  id: string;
  name: string;
  rut?: string | null;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  hourlyRate?: number | null;
  status: WorkerStatus;
  crewId?: string | null;
  crew?: { id: string; name: string } | null;
  createdAt: string;
}

interface CrewOption {
  id: string;
  name: string;
}

interface WorkerForm {
  name: string;
  rut: string;
  role: string;
  phone: string;
  email: string;
  hourlyRate: string;
  crewId: string;
  status: string;
}

const EMPTY_FORM: WorkerForm = {
  name: '',
  rut: '',
  role: '',
  phone: '',
  email: '',
  hourlyRate: '',
  crewId: '',
  status: WorkerStatus.ACTIVE,
};

export default function WorkersPage() {
  const [rows, setRows] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, lastPage: 1 });

  const [crews, setCrews] = useState<CrewOption[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WorkerRow | null>(null);
  const [form, setForm] = useState<WorkerForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/workers', {
        params: { page, limit: 20, search: search.trim() || undefined },
      });
      setRows(data.data);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .get('/crews', { params: { page: 1, limit: 100 } })
      .then(({ data }) => setCrews(data.data ?? []))
      .catch(() => setCrews([]));
  }, []);

  const filtered = useMemo(() => {
    if (!statusFilter) return rows;
    return rows.filter((w) => w.status === statusFilter);
  }, [rows, statusFilter]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(worker: WorkerRow) {
    setEditing(worker);
    setForm({
      name: worker.name,
      rut: worker.rut ?? '',
      role: worker.role ?? '',
      phone: worker.phone ?? '',
      email: worker.email ?? '',
      hourlyRate: worker.hourlyRate != null ? String(worker.hourlyRate) : '',
      crewId: worker.crewId ?? '',
      status: worker.status,
    });
    setFormError('');
    setModalOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const base = {
        name: form.name.trim(),
        rut: form.rut.trim() || undefined,
        role: form.role.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        crewId: form.crewId || undefined,
      };
      if (editing) {
        await api.patch(`/workers/${editing.id}`, {
          ...base,
          crewId: form.crewId || null,
          status: form.status,
        });
      } else {
        await api.post('/workers', base);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'No se pudo guardar el trabajador'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(worker: WorkerRow) {
    if (!window.confirm(`¿Eliminar al trabajador "${worker.name}"?`)) return;
    try {
      await api.delete(`/workers/${worker.id}`);
      await load();
    } catch (err) {
      window.alert(apiErrorMessage(err, 'No se pudo eliminar el trabajador'));
    }
  }

  const hasFilters = Boolean(search.trim() || statusFilter);

  return (
    <div className="p-6 flex-1">
      <PageHeader
        title="Trabajadores"
        subtitle={`${meta.total} registrado${meta.total === 1 ? '' : 's'}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => load()}>
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo trabajador
            </Button>
          </>
        }
      />

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Buscar por nombre, RUT o especialidad..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sm:w-52"
          >
            <option value="">Todos los estados</option>
            {Object.values(WorkerStatus).map((s) => (
              <option key={s} value={s}>
                {WORKER_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <THead>
            <TR className="bg-surface-secondary hover:bg-surface-secondary">
              <TH>Trabajador</TH>
              <TH style={{ width: 150 }}>Rol / Especialidad</TH>
              <TH style={{ width: 150 }}>Cuadrilla</TH>
              <TH style={{ width: 180 }}>Contacto</TH>
              <TH style={{ width: 120 }}>Tarifa / h</TH>
              <TH style={{ width: 100 }}>Estado</TH>
              <TH style={{ width: 80 }} />
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
                    {hasFilters ? (
                      <>
                        <Search className="h-10 w-10 text-text-muted" />
                        <div>
                          <p className="font-medium text-text-primary">Sin resultados</p>
                          <p className="mt-1 text-xs text-text-muted">
                            Probá ajustando los filtros de búsqueda
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <User className="h-10 w-10 text-text-muted" />
                        <div>
                          <p className="font-medium text-text-primary">Sin trabajadores</p>
                          <p className="mt-1 text-xs text-text-muted">
                            Agregá trabajadores para registrar horas en órdenes de trabajo
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((worker) => (
                <TR key={worker.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-tertiary text-2xs font-semibold text-text-secondary">
                        {initials(worker.name)}
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">{worker.name}</div>
                        {worker.rut && (
                          <div className="text-xs text-text-muted">{worker.rut}</div>
                        )}
                      </div>
                    </div>
                  </TD>
                  <TD className="text-text-secondary">{worker.role || '—'}</TD>
                  <TD className="text-text-secondary">{worker.crew?.name || '—'}</TD>
                  <TD>
                    {worker.phone || worker.email ? (
                      <div className="text-xs">
                        {worker.phone && (
                          <div className="text-text-primary">{worker.phone}</div>
                        )}
                        {worker.email && (
                          <div className="text-text-muted">{worker.email}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-text-secondary">—</span>
                    )}
                  </TD>
                  <TD className="text-text-secondary">{formatCurrency(worker.hourlyRate)}</TD>
                  <TD>
                    <Badge tone={WORKER_STATUS_TONE[worker.status]}>
                      {WORKER_STATUS_LABEL[worker.status]}
                    </Badge>
                  </TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(worker)}
                        className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(worker)}
                        className="p-1.5 rounded-md text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
        title={editing ? 'Editar trabajador' : 'Nuevo trabajador'}
        description={
          editing
            ? 'Actualizá los datos del trabajador.'
            : 'Registrá un nuevo trabajador.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form="worker-form" disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear trabajador'}
            </Button>
          </>
        }
      >
        <form id="worker-form" onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Juan Pérez"
                required
              />
            </Field>
            <Field label="RUT / Documento">
              <Input
                value={form.rut}
                onChange={(e) => setForm({ ...form, rut: e.target.value })}
                placeholder="12.345.678-9"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Rol / Especialidad">
              <Input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Electricista"
              />
            </Field>
            <Field label="Cuadrilla">
              <Select
                value={form.crewId}
                onChange={(e) => setForm({ ...form, crewId: e.target.value })}
              >
                <option value="">Sin asignar</option>
                {crews.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Teléfono">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+56 9 1234 5678"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="juan@empresa.com"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tarifa por hora">
              <Input
                type="number"
                min={0}
                value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                placeholder="0"
              />
            </Field>
            {editing && (
              <Field label="Estado">
                <Select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {Object.values(WorkerStatus).map((s) => (
                    <option key={s} value={s}>
                      {WORKER_STATUS_LABEL[s]}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </div>

          {formError && <p className="text-sm text-red-500">{formError}</p>}
        </form>
      </Modal>
    </div>
  );
}
