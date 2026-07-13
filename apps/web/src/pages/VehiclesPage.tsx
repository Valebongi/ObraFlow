import { useCallback, useEffect, useMemo, useState } from 'react';
import { Truck, Plus, RefreshCw, Search, Pencil, Trash2 } from 'lucide-react';
import { VehicleStatus } from '@obraflow/shared';
import { api, apiErrorMessage } from '@/lib/api';
import { VEHICLE_STATUS_LABEL, VEHICLE_STATUS_TONE } from '@/lib/labels';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';

interface VehicleRow {
  id: string;
  plate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  status: VehicleStatus;
  notes: string | null;
  crews?: { id: string; name: string }[];
}

interface VehicleForm {
  plate: string;
  brand: string;
  model: string;
  year: string;
  status: VehicleStatus;
  notes: string;
}

const emptyForm: VehicleForm = {
  plate: '',
  brand: '',
  model: '',
  year: '',
  status: VehicleStatus.AVAILABLE,
  notes: '',
};

const STATUS_OPTIONS = Object.values(VehicleStatus);

export default function VehiclesPage() {
  const [rows, setRows] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, lastPage: 1 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleRow | null>(null);
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/vehicles', {
        params: { page, limit: 20, search: search || undefined },
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

  // The API does not filter by status, so it is applied on the loaded page.
  const visibleRows = useMemo(
    () => (statusFilter ? rows.filter((r) => r.status === statusFilter) : rows),
    [rows, statusFilter],
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(row: VehicleRow) {
    setEditing(row);
    setForm({
      plate: row.plate,
      brand: row.brand ?? '',
      model: row.model ?? '',
      year: row.year != null ? String(row.year) : '',
      status: row.status,
      notes: row.notes ?? '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        plate: form.plate.trim(),
        brand: form.brand.trim() || undefined,
        model: form.model.trim() || undefined,
        status: form.status,
        notes: form.notes.trim() || undefined,
      };
      if (form.year.trim() !== '') payload.year = Number(form.year);

      if (editing) {
        await api.patch(`/vehicles/${editing.id}`, payload);
      } else {
        await api.post('/vehicles', payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'No se pudo guardar el vehículo'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: VehicleRow) {
    if (!window.confirm(`¿Eliminar el vehículo "${row.plate}"?`)) return;
    try {
      await api.delete(`/vehicles/${row.id}`);
      await load();
    } catch (err) {
      window.alert(apiErrorMessage(err, 'No se pudo eliminar el vehículo'));
    }
  }

  const showEmpty = !loading && visibleRows.length === 0;
  const filtering = Boolean(search || statusFilter);

  return (
    <div className="p-6 flex-1">
      <PageHeader
        title="Vehículos"
        subtitle={`${meta.total} registrado${meta.total === 1 ? '' : 's'}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => load()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo vehículo
            </Button>
          </>
        }
      />

      <Card className="mb-4 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            <Input
              className="pl-9"
              placeholder="Buscar por patente, marca o modelo..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <Select
            className="sm:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {VEHICLE_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : showEmpty ? (
          <EmptyState
            icon={filtering ? Search : Truck}
            title={filtering ? 'Sin resultados' : 'No hay vehículos registrados'}
            description={
              filtering
                ? 'Probá ajustando los filtros de búsqueda'
                : 'Registrá los vehículos de tu flota para asignarlos a las cuadrillas'
            }
            action={
              !filtering && (
                <Button variant="primary" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Nuevo vehículo
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Patente</TH>
                  <TH>Marca / Modelo</TH>
                  <TH style={{ width: 100 }}>Año</TH>
                  <TH style={{ width: 140 }}>Estado</TH>
                  <TH style={{ width: 220 }}>Notas</TH>
                  <TH style={{ width: 80 }}> </TH>
                </TR>
              </THead>
              <TBody>
                {visibleRows.map((row) => (
                  <TR key={row.id}>
                    <TD className="font-medium text-text-primary uppercase">{row.plate}</TD>
                    <TD>
                      {row.brand || row.model
                        ? `${row.brand ?? ''}${row.brand && row.model ? ' ' : ''}${row.model ?? ''}`
                        : '—'}
                    </TD>
                    <TD className="text-text-secondary">{row.year ?? '—'}</TD>
                    <TD>
                      <Badge tone={VEHICLE_STATUS_TONE[row.status] ?? 'gray'}>
                        {VEHICLE_STATUS_LABEL[row.status] ?? row.status}
                      </Badge>
                    </TD>
                    <TD className="max-w-[220px] truncate text-text-secondary" title={row.notes ?? ''}>
                      {row.notes || '—'}
                    </TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(row)}
                          className="p-1.5 rounded-md text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors"
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
            <Pagination page={meta.page} lastPage={meta.lastPage} total={meta.total} onPage={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar vehículo' : 'Nuevo vehículo'}
        description={editing ? 'Actualizá los datos del vehículo' : 'Registrá un nuevo vehículo en la flota'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="vehicle-form" disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear vehículo'}
            </Button>
          </>
        }
      >
        <form id="vehicle-form" onSubmit={submit} className="space-y-4">
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <Field label="Patente" required>
            <Input
              required
              value={form.plate}
              onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value }))}
              placeholder="AB123CD"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Marca">
              <Input
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                placeholder="Toyota"
              />
            </Field>
            <Field label="Modelo">
              <Input
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                placeholder="Hilux"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Año">
              <Input
                type="number"
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                placeholder="2022"
              />
            </Field>
            <Field label="Estado">
              <Select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as VehicleStatus }))}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {VEHICLE_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Notas">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Información adicional..."
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
