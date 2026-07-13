import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { FileText, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table';

interface ContractClient {
  id: string;
  name: string;
}

interface Contract {
  id: string;
  name: string;
  code?: string | null;
  clientId: string;
  client?: ContractClient | null;
  startDate?: string | null;
  endDate?: string | null;
  value?: number | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface ContractForm {
  name: string;
  code: string;
  clientId: string;
  value: string;
  startDate: string;
  endDate: string;
  description: string;
  isActive: boolean;
}

const EMPTY_FORM: ContractForm = {
  name: '',
  code: '',
  clientId: '',
  value: '',
  startDate: '',
  endDate: '',
  description: '',
  isActive: true,
};

function toDateInput(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function ContractsPage() {
  const [rows, setRows] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, lastPage: 1 });

  const [clients, setClients] = useState<ContractClient[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [form, setForm] = useState<ContractForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/contracts', { params: { page, limit: 20, search } });
      setRows(data.data);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const loadClients = useCallback(async () => {
    try {
      const { data } = await api.get('/clients', { params: { page: 1, limit: 100 } });
      setClients(data.data);
    } catch {
      setClients([]);
    }
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    loadClients();
    setModalOpen(true);
  }

  function openEdit(contract: Contract) {
    setEditing(contract);
    setForm({
      name: contract.name ?? '',
      code: contract.code ?? '',
      clientId: contract.clientId ?? '',
      value: contract.value != null ? String(contract.value) : '',
      startDate: toDateInput(contract.startDate),
      endDate: toDateInput(contract.endDate),
      description: contract.description ?? '',
      isActive: contract.isActive,
    });
    setError('');
    loadClients();
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      clientId: form.clientId,
      value: form.value.trim() ? Number(form.value) : undefined,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      description: form.description.trim() || undefined,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await api.patch(`/contracts/${editing.id}`, payload);
      } else {
        await api.post('/contracts', payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo guardar el contrato'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(contract: Contract) {
    if (!window.confirm(`¿Eliminar el contrato "${contract.name}"?`)) return;
    try {
      await api.delete(`/contracts/${contract.id}`);
      await load();
    } catch (err) {
      window.alert(apiErrorMessage(err, 'No se pudo eliminar el contrato'));
    }
  }

  function onSearch(value: string) {
    setPage(1);
    setSearch(value);
  }

  function renderVigencia(contract: Contract) {
    if (!contract.startDate && !contract.endDate) {
      return <span className="text-text-muted">—</span>;
    }
    return (
      <span>
        {formatDate(contract.startDate)} – {formatDate(contract.endDate)}
      </span>
    );
  }

  return (
    <div className="p-6 flex-1">
      <PageHeader
        title="Contratos"
        subtitle={`${meta.total} registrados`}
        actions={
          <>
            <Button variant="secondary" onClick={load}>
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo contrato
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
              placeholder="Buscar por nombre, código o cliente..."
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
            icon={FileText}
            title={search ? 'Sin resultados' : 'Sin contratos'}
            description={
              search
                ? 'Probá ajustando los filtros de búsqueda'
                : 'Agregá contratos para asociarlos a órdenes de trabajo'
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Nombre / Código</TH>
                  <TH style={{ width: 160 }}>Cliente</TH>
                  <TH style={{ width: 130 }}>Valor</TH>
                  <TH style={{ width: 200 }}>Vigencia</TH>
                  <TH style={{ width: 100 }}>Estado</TH>
                  <TH style={{ width: 80 }} />
                </TR>
              </THead>
              <TBody>
                {rows.map((contract) => (
                  <TR key={contract.id}>
                    <TD>
                      <div className="font-medium text-text-primary">{contract.name}</div>
                      {contract.code && (
                        <div className="text-xs text-text-muted">{contract.code}</div>
                      )}
                    </TD>
                    <TD>
                      <span className={contract.client ? '' : 'text-text-muted'}>
                        {contract.client?.name || '—'}
                      </span>
                    </TD>
                    <TD>
                      {contract.value != null ? (
                        formatCurrency(contract.value)
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </TD>
                    <TD>{renderVigencia(contract)}</TD>
                    <TD>
                      <Badge tone={contract.isActive ? 'green' : 'gray'}>
                        {contract.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!px-1.5"
                          aria-label="Editar"
                          onClick={() => openEdit(contract)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!px-1.5 text-red-600 hover:text-red-700"
                          aria-label="Eliminar"
                          onClick={() => handleDelete(contract)}
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
        title={editing ? 'Editar contrato' : 'Nuevo contrato'}
        description={
          editing ? 'Actualizá los datos del contrato' : 'Registrá un nuevo contrato'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="contract-form" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <form id="contract-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contrato marco 2026"
                required
              />
            </Field>
            <Field label="Código">
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="CTR-001"
              />
            </Field>
          </div>
          <Field label="Cliente" required>
            <Select
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              required
            >
              <option value="" disabled>
                Seleccioná un cliente
              </option>
              {editing?.client &&
                !clients.some((c) => c.id === editing.client?.id) && (
                  <option value={editing.client.id}>{editing.client.name}</option>
                )}
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Valor">
            <Input
              type="number"
              min={0}
              step="any"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder="0"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Inicio">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </Field>
            <Field label="Fin">
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Descripción">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalle del contrato"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border text-brand focus:ring-brand/30"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Contrato activo
          </label>
        </form>
      </Modal>
    </div>
  );
}
