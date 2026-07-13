import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Building2, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table';

interface Client {
  id: string;
  name: string;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
  _count?: { workOrders?: number };
}

interface ClientForm {
  name: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

const EMPTY_FORM: ClientForm = {
  name: '',
  taxId: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
};

export default function ClientsPage() {
  const [rows, setRows] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, lastPage: 1 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/clients', { params: { page, limit: 20, search } });
      setRows(data.data);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setForm({
      name: client.name ?? '',
      taxId: client.taxId ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      address: client.address ?? '',
      notes: client.notes ?? '',
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      taxId: form.taxId.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    try {
      if (editing) {
        await api.patch(`/clients/${editing.id}`, payload);
      } else {
        await api.post('/clients', payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo guardar el cliente'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(client: Client) {
    if (!window.confirm(`¿Eliminar el cliente "${client.name}"?`)) return;
    try {
      await api.delete(`/clients/${client.id}`);
      await load();
    } catch (err) {
      window.alert(apiErrorMessage(err, 'No se pudo eliminar el cliente'));
    }
  }

  function onSearch(value: string) {
    setPage(1);
    setSearch(value);
  }

  return (
    <div className="p-6 flex-1">
      <PageHeader
        title="Clientes"
        subtitle={`${meta.total} clientes registrados`}
        actions={
          <>
            <Button variant="secondary" onClick={load}>
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <CardBody>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre, CUIT, email..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={search ? 'Sin resultados' : 'Sin clientes'}
            description={
              search
                ? 'Probá ajustando los filtros de búsqueda'
                : 'Creá tu primer cliente usando el botón de arriba'
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH sortable>Empresa</TH>
                  <TH>Contacto</TH>
                  <TH>Dirección</TH>
                  <TH style={{ width: 110 }}>Órdenes</TH>
                  <TH style={{ width: 110 }}>Alta</TH>
                  <TH style={{ width: 80 }} />
                </TR>
              </THead>
              <TBody>
                {rows.map((client) => (
                  <TR key={client.id}>
                    <TD>
                      <div className="font-medium text-text-primary">{client.name}</div>
                      {client.taxId && (
                        <div className="text-xs text-text-muted">{client.taxId}</div>
                      )}
                    </TD>
                    <TD>
                      {client.email || client.phone ? (
                        <div className="space-y-0.5">
                          {client.email && (
                            <div className="text-text-primary">{client.email}</div>
                          )}
                          {client.phone && (
                            <div className="text-xs text-text-muted">{client.phone}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </TD>
                    <TD>
                      <span className={client.address ? '' : 'text-text-muted'}>
                        {client.address || '—'}
                      </span>
                    </TD>
                    <TD>{client._count?.workOrders ?? 0}</TD>
                    <TD>{formatDate(client.createdAt)}</TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!px-1.5"
                          aria-label="Editar"
                          onClick={() => openEdit(client)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!px-1.5 text-red-600 hover:text-red-700"
                          aria-label="Eliminar"
                          onClick={() => handleDelete(client)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
        title={editing ? 'Editar cliente' : 'Nuevo cliente'}
        description={
          editing ? 'Actualizá los datos del cliente' : 'Registrá un nuevo cliente'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="client-form" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <form id="client-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}
          <Field label="Nombre / Empresa" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Acme Corp"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="CUIT / RUT">
              <Input
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                placeholder="12345678-9"
              />
            </Field>
            <Field label="Teléfono">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+56912345678"
              />
            </Field>
          </div>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contacto@acme.com"
            />
          </Field>
          <Field label="Dirección">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Av. Principal 123"
            />
          </Field>
          <Field label="Notas">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas internas del cliente"
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
