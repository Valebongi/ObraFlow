import { useCallback, useEffect, useMemo, useState } from 'react';
import { HardHat, Plus, RefreshCw, Search, Pencil, Trash2 } from 'lucide-react';
import { CrewStatus, CrewType } from '@obraflow/shared';
import { api, apiErrorMessage } from '@/lib/api';
import {
  CREW_STATUS_LABEL,
  CREW_STATUS_TONE,
  CREW_TYPE_LABEL,
} from '@/lib/labels';
import { formatDate, formatNumber } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';

interface CrewRow {
  id: string;
  name: string;
  code: string;
  type: CrewType;
  status: CrewStatus;
  leaderId?: string | null;
  vehicleId?: string | null;
  notes?: string | null;
  createdAt: string;
  leader?: { id: string; name: string } | null;
  vehicle?: { id: string; plate: string } | null;
  _count?: { workers: number; workOrders?: number };
}

interface UserOption {
  id: string;
  name: string;
}

interface CrewForm {
  name: string;
  code: string;
  type: string;
  leaderId: string;
  status: string;
  notes: string;
}

const EMPTY_FORM: CrewForm = {
  name: '',
  code: '',
  type: CrewType.OWN,
  leaderId: '',
  status: CrewStatus.AVAILABLE,
  notes: '',
};

export default function CrewsPage() {
  const [rows, setRows] = useState<CrewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, lastPage: 1 });

  const [leaders, setLeaders] = useState<UserOption[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CrewRow | null>(null);
  const [form, setForm] = useState<CrewForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/crews', { params: { page, limit: 20 } });
      setRows(data.data);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .get('/users', { params: { page: 1, limit: 100 } })
      .then(({ data }) => setLeaders(data.data ?? []))
      .catch(() => setLeaders([]));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((c) => {
      const matchesSearch =
        !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(crew: CrewRow) {
    setEditing(crew);
    setForm({
      name: crew.name,
      code: crew.code,
      type: crew.type,
      leaderId: crew.leaderId ?? '',
      status: crew.status,
      notes: crew.notes ?? '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        type: form.type,
        leaderId: form.leaderId || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (editing) {
        await api.patch(`/crews/${editing.id}`, payload);
        if (form.status !== editing.status) {
          await api.patch(`/crews/${editing.id}/status`, { status: form.status });
        }
      } else {
        await api.post('/crews', payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'No se pudo guardar la cuadrilla'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(crew: CrewRow) {
    if (!window.confirm(`¿Eliminar la cuadrilla "${crew.name}"?`)) return;
    try {
      await api.delete(`/crews/${crew.id}`);
      await load();
    } catch (err) {
      window.alert(apiErrorMessage(err, 'No se pudo eliminar la cuadrilla'));
    }
  }

  const hasFilters = Boolean(search.trim() || statusFilter);

  return (
    <div className="p-6 flex-1">
      <PageHeader
        title="Cuadrillas"
        subtitle={`${meta.total} ${meta.total === 1 ? 'cuadrilla registrada' : 'cuadrillas registradas'}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => load()}>
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nueva cuadrilla
            </Button>
          </>
        }
      />

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sm:w-52"
          >
            <option value="">Todos los estados</option>
            {Object.values(CrewStatus).map((s) => (
              <option key={s} value={s}>
                {CREW_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <THead>
            <TR className="bg-surface-secondary hover:bg-surface-secondary">
              <TH sortable>Cuadrilla</TH>
              <TH style={{ width: 130 }}>Tipo</TH>
              <TH style={{ width: 130 }}>Trabajadores</TH>
              <TH style={{ width: 110 }}>Órdenes</TH>
              <TH style={{ width: 110 }}>Estado</TH>
              <TH style={{ width: 110 }}>Creada</TH>
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
                        <HardHat className="h-10 w-10 text-text-muted" />
                        <div>
                          <p className="font-medium text-text-primary">Sin cuadrillas</p>
                          <p className="mt-1 text-xs text-text-muted">
                            Agregá tu primera cuadrilla de trabajo
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((crew) => (
                <TR key={crew.id}>
                  <TD>
                    <div className="font-medium text-text-primary">{crew.name}</div>
                    <div className="text-xs text-text-muted">
                      {crew.code}
                      {crew.leader?.name ? ` · ${crew.leader.name}` : ''}
                    </div>
                  </TD>
                  <TD className="text-text-secondary">{CREW_TYPE_LABEL[crew.type]}</TD>
                  <TD className="text-text-secondary">
                    {formatNumber(crew._count?.workers ?? 0)}
                  </TD>
                  <TD className="text-text-secondary">
                    {formatNumber(crew._count?.workOrders ?? 0)}
                  </TD>
                  <TD>
                    <Badge tone={CREW_STATUS_TONE[crew.status]}>
                      {CREW_STATUS_LABEL[crew.status]}
                    </Badge>
                  </TD>
                  <TD className="text-text-secondary">{formatDate(crew.createdAt)}</TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(crew)}
                        className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(crew)}
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
        title={editing ? 'Editar cuadrilla' : 'Nueva cuadrilla'}
        description={
          editing
            ? 'Actualizá los datos de la cuadrilla.'
            : 'Creá una nueva cuadrilla de trabajo.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form="crew-form" disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear cuadrilla'}
            </Button>
          </>
        }
      >
        <form id="crew-form" onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Cuadrilla Norte"
                required
              />
            </Field>
            <Field label="Código" required>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="CRW-001"
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tipo" required>
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {Object.values(CrewType).map((t) => (
                  <option key={t} value={t}>
                    {CREW_TYPE_LABEL[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Jefe de cuadrilla">
              <Select
                value={form.leaderId}
                onChange={(e) => setForm({ ...form, leaderId: e.target.value })}
              >
                <option value="">Sin asignar</option>
                {leaders.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {editing && (
            <Field label="Estado">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {Object.values(CrewStatus).map((s) => (
                  <option key={s} value={s}>
                    {CREW_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Notas">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Observaciones de la cuadrilla..."
            />
          </Field>

          {formError && <p className="text-sm text-red-500">{formError}</p>}
        </form>
      </Modal>
    </div>
  );
}
