import { useCallback, useEffect, useState } from 'react';
import { MapPin, Plus, RefreshCw, Search, Pencil, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';

interface ClientOption {
  id: string;
  name: string;
}

interface LocationRow {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  clientId: string | null;
  client: ClientOption | null;
}

interface LocationForm {
  name: string;
  address: string;
  clientId: string;
  lat: string;
  lng: string;
  notes: string;
}

const emptyForm: LocationForm = {
  name: '',
  address: '',
  clientId: '',
  lat: '',
  lng: '',
  notes: '',
};

export default function LocationsPage() {
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, lastPage: 1 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LocationRow | null>(null);
  const [form, setForm] = useState<LocationForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/locations', {
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

  useEffect(() => {
    api
      .get('/clients', { params: { page: 1, limit: 100 } })
      .then(({ data }) => setClients(data.data))
      .catch(() => setClients([]));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(row: LocationRow) {
    setEditing(row);
    setForm({
      name: row.name,
      address: row.address,
      clientId: row.clientId ?? '',
      lat: row.lat != null ? String(row.lat) : '',
      lng: row.lng != null ? String(row.lng) : '',
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
        name: form.name.trim(),
        address: form.address.trim(),
        clientId: form.clientId || null,
        notes: form.notes.trim() || undefined,
      };
      if (form.lat.trim() !== '') payload.lat = Number(form.lat);
      if (form.lng.trim() !== '') payload.lng = Number(form.lng);

      if (editing) {
        await api.patch(`/locations/${editing.id}`, payload);
      } else {
        await api.post('/locations', payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'No se pudo guardar la ubicación'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: LocationRow) {
    if (!window.confirm(`¿Eliminar la ubicación "${row.name}"?`)) return;
    try {
      await api.delete(`/locations/${row.id}`);
      await load();
    } catch (err) {
      window.alert(apiErrorMessage(err, 'No se pudo eliminar la ubicación'));
    }
  }

  const showEmpty = !loading && rows.length === 0;

  return (
    <div className="p-6 flex-1">
      <PageHeader
        title="Ubicaciones"
        subtitle={`${meta.total} registrada${meta.total === 1 ? '' : 's'}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => load()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nueva ubicación
            </Button>
          </>
        }
      />

      <Card className="mb-4 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre o dirección..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : showEmpty ? (
          <EmptyState
            icon={search ? Search : MapPin}
            title={search ? 'Sin resultados' : 'Sin ubicaciones'}
            description={
              search
                ? 'Probá ajustando los filtros de búsqueda'
                : 'Agregá ubicaciones para asociarlas a órdenes de trabajo'
            }
            action={
              !search && (
                <Button variant="primary" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Nueva ubicación
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Nombre / Dirección</TH>
                  <TH style={{ width: 160 }}>Cliente</TH>
                  <TH style={{ width: 160 }}>Coordenadas</TH>
                  <TH style={{ width: 220 }}>Notas</TH>
                  <TH style={{ width: 80 }}> </TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((row) => (
                  <TR key={row.id}>
                    <TD>
                      <div className="font-medium text-text-primary">{row.name}</div>
                      <div className="text-xs text-text-secondary">{row.address}</div>
                    </TD>
                    <TD>{row.client?.name ?? '—'}</TD>
                    <TD className="text-text-secondary">
                      {row.lat != null && row.lng != null ? `${row.lat}, ${row.lng}` : '—'}
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
        title={editing ? 'Editar ubicación' : 'Nueva ubicación'}
        description={editing ? 'Actualizá los datos de la ubicación' : 'Registrá una nueva ubicación'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="location-form" disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear ubicación'}
            </Button>
          </>
        }
      >
        <form id="location-form" onSubmit={submit} className="space-y-4">
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <Field label="Nombre" required>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Depósito Central"
            />
          </Field>
          <Field label="Dirección" required>
            <Input
              required
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Av. Siempre Viva 742"
            />
          </Field>
          <Field label="Cliente">
            <Select
              value={form.clientId}
              onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
            >
              <option value="">Sin cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitud">
              <Input
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                placeholder="-34.6037"
              />
            </Field>
            <Field label="Longitud">
              <Input
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                placeholder="-58.3816"
              />
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
