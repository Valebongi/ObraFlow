import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Search, Briefcase, Pencil, Trash2 } from 'lucide-react';
import { SubRateModel } from '@obraflow/shared';
import { api, apiErrorMessage } from '@/lib/api';
import { SUB_RATE_MODEL_LABEL } from '@/lib/labels';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Table, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';

interface CrewRef {
  id: string;
  name: string;
}

interface Subcontractor {
  id: string;
  name: string;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  rateModel?: string | null;
  rateValue?: number | null;
  crewId?: string | null;
  crew?: CrewRef | null;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

interface FormState {
  name: string;
  taxId: string;
  email: string;
  phone: string;
  rateModel: string;
  rateValue: string;
  crewId: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  taxId: '',
  email: '',
  phone: '',
  rateModel: SubRateModel.PER_OT,
  rateValue: '',
  crewId: '',
};

export default function SubcontractorsPage() {
  const [rows, setRows] = useState<Subcontractor[]>([]);
  const [crews, setCrews] = useState<CrewRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, lastPage: 1 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subcontractor | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/subcontractors', { params: { page, limit: 20, search } });
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

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (row: Subcontractor) => {
    setEditing(row);
    setForm({
      name: row.name ?? '',
      taxId: row.taxId ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
      rateModel: row.rateModel ?? SubRateModel.PER_OT,
      rateValue: row.rateValue != null ? String(row.rateValue) : '',
      crewId: row.crewId ?? row.crew?.id ?? '',
    });
    setError(null);
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      taxId: form.taxId.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      rateModel: form.rateModel || undefined,
      rateValue: form.rateValue !== '' ? Number(form.rateValue) : undefined,
      crewId: form.crewId || (editing ? null : undefined),
    };
    try {
      if (editing) {
        await api.patch(`/subcontractors/${editing.id}`, payload);
      } else {
        await api.post('/subcontractors', payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo guardar el subcontratista'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Subcontractor) => {
    if (!window.confirm(`¿Eliminar el subcontratista "${row.name}"?`)) return;
    try {
      await api.delete(`/subcontractors/${row.id}`);
      await load();
    } catch (err) {
      window.alert(apiErrorMessage(err, 'No se pudo eliminar el subcontratista'));
    }
  };

  const onSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="p-6 flex-1">
      <PageHeader
        title="Subcontratistas"
        subtitle={`${meta.total} subcontratistas registrados`}
        actions={
          <>
            <Button variant="secondary" onClick={load}>
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo subcontratista
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <CardBody className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Buscar por nombre, email, RUT..."
              className="pl-9"
            />
          </div>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={search ? 'Sin resultados' : 'No hay subcontratistas registrados'}
            description={
              search
                ? 'Probá ajustando los filtros de búsqueda'
                : 'Agregá subcontratistas para asignarlos a tus cuadrillas'
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Subcontratista</TH>
                  <TH style={{ width: 200 }}>Contacto</TH>
                  <TH style={{ width: 160 }}>Tarifa</TH>
                  <TH style={{ width: 160 }}>Cuadrilla asociada</TH>
                  <TH style={{ width: 80 }} />
                </TR>
              </THead>
              <TBody>
                {rows.map((row) => (
                  <TR key={row.id}>
                    <TD>
                      <div className="font-medium text-text-primary">{row.name}</div>
                      {row.taxId && <div className="text-xs text-text-muted">{row.taxId}</div>}
                    </TD>
                    <TD>
                      {row.email ? (
                        <div className="text-text-primary">{row.email}</div>
                      ) : null}
                      {row.phone ? (
                        <div className="text-xs text-text-muted">{row.phone}</div>
                      ) : null}
                      {!row.email && !row.phone && <span className="text-text-muted">—</span>}
                    </TD>
                    <TD>
                      {row.rateValue != null ? (
                        <div>
                          <div className="text-text-primary">{formatCurrency(row.rateValue)}</div>
                          <div className="text-xs text-text-muted">
                            {SUB_RATE_MODEL_LABEL[(row.rateModel as SubRateModel) ?? SubRateModel.PER_OT]}
                          </div>
                        </div>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </TD>
                    <TD>{row.crew?.name ?? <span className="text-text-muted">—</span>}</TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(row)}
                          className="p-1.5 rounded-md text-text-secondary hover:bg-surface-tertiary hover:text-text-primary transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => remove(row)}
                          className="p-1.5 rounded-md text-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination
              page={meta.page}
              lastPage={meta.lastPage}
              total={meta.total}
              onPage={setPage}
            />
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar subcontratista' : 'Nuevo subcontratista'}
        description={
          editing ? 'Actualizá los datos del subcontratista' : 'Registrá un nuevo subcontratista'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="subcontractor-form" disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear subcontratista'}
            </Button>
          </>
        }
      >
        <form id="subcontractor-form" onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <Field label="Nombre" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Razón social o nombre"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="RUT">
              <Input
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                placeholder="76.543.210-9"
              />
            </Field>
            <Field label="Teléfono">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+56 9 1234 5678"
              />
            </Field>
          </div>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contacto@empresa.cl"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Modelo de tarifa">
              <Select
                value={form.rateModel}
                onChange={(e) => setForm({ ...form, rateModel: e.target.value })}
              >
                {Object.values(SubRateModel).map((m) => (
                  <option key={m} value={m}>
                    {SUB_RATE_MODEL_LABEL[m]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tarifa">
              <Input
                type="number"
                min={0}
                step="any"
                value={form.rateValue}
                onChange={(e) => setForm({ ...form, rateValue: e.target.value })}
                placeholder="0"
              />
            </Field>
          </div>
          <Field label="Cuadrilla asociada">
            <Select
              value={form.crewId}
              onChange={(e) => setForm({ ...form, crewId: e.target.value })}
            >
              <option value="">Sin cuadrilla</option>
              {crews.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </form>
      </Modal>
    </div>
  );
}
