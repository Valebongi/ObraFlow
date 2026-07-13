import { useCallback, useEffect, useState } from 'react';
import { Plus, Shield, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select } from '@/components/ui/Input';
import { Table, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { Spinner } from '@/components/ui/Spinner';

interface PortalUser {
  id: string;
  email: string;
  clientId: string;
  clientName: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

interface ClientOption {
  id: string;
  name: string;
}

interface CreateForm {
  clientId: string;
  email: string;
  password: string;
}

const EMPTY_CREATE: CreateForm = { clientId: '', email: '', password: '' };

export default function PortalAccessPage() {
  const [rows, setRows] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_CREATE);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/portal-admin/users');
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = async () => {
    setForm(EMPTY_CREATE);
    setCreateError(null);
    setCreateOpen(true);
    try {
      const { data } = await api.get('/clients', { params: { page: 1, limit: 100 } });
      setClients(data.data);
    } catch {
      setClients([]);
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await api.post('/portal-admin/users', form);
      setCreateOpen(false);
      await load();
    } catch (err) {
      setCreateError(apiErrorMessage(err, 'No se pudo crear el acceso'));
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (u: PortalUser) => {
    if (!window.confirm(`¿Revocar el acceso de ${u.email}?`)) return;
    try {
      await api.delete(`/portal-admin/users/${u.id}`);
      await load();
    } catch (err) {
      window.alert(apiErrorMessage(err, 'No se pudo revocar el acceso'));
    }
  };

  return (
    <div className="p-6 flex-1">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Acceso al Portal</h1>
            <p className="text-text-muted text-sm mt-1">
              Gestioná qué clientes pueden ver sus órdenes de trabajo.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-dark-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo acceso
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 text-sm text-blue-700 flex items-start gap-2">
          <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            Los clientes ingresan al portal en{' '}
            <code className="bg-blue-100 border border-blue-200 rounded px-1 text-xs font-mono">
              /portal/login
            </code>{' '}
            usando su email, contraseña y el código de tu organización. Tu código es visible en
            Configuración.
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="h-6 w-6" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-25" />
              <p className="font-medium">Sin accesos configurados</p>
              <p className="text-sm mt-1 text-text-muted/70">
                Creá un acceso para que tus clientes puedan ingresar al portal.
              </p>
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Cliente</TH>
                  <TH>Email</TH>
                  <TH style={{ width: 100 }}>Estado</TH>
                  <TH style={{ width: 150 }}>Último acceso</TH>
                  <TH style={{ width: 110 }}>Alta</TH>
                  <TH style={{ width: 70 }} />
                </TR>
              </THead>
              <TBody>
                {rows.map((u) => (
                  <TR key={u.id}>
                    <TD>
                      <span className="font-medium text-text-primary">{u.clientName}</span>
                    </TD>
                    <TD>{u.email}</TD>
                    <TD>
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1.5 font-medium border rounded-full px-2.5 py-1 text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-emerald-500" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-medium border rounded-full px-2.5 py-1 text-xs bg-surface-tertiary text-text-secondary border-border">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-text-muted" />
                          Inactivo
                        </span>
                      )}
                    </TD>
                    <TD>
                      {u.lastLoginAt ? (
                        formatDateTime(u.lastLoginAt)
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </TD>
                    <TD>
                      <span className="text-text-muted">{formatDate(u.createdAt)}</span>
                    </TD>
                    <TD>
                      <button
                        onClick={() => revoke(u)}
                        className="p-1.5 text-text-muted hover:text-red-600 hover:bg-surface-tertiary rounded-lg transition-colors"
                        title="Revocar acceso"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </div>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nuevo acceso"
        description="Creá credenciales de portal para un cliente."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button type="submit" form="portal-create-form" disabled={creating}>
              {creating ? 'Creando…' : 'Crear acceso'}
            </Button>
          </>
        }
      >
        <form id="portal-create-form" onSubmit={submitCreate} className="space-y-4">
          <Field label="Cliente" required>
            <Select
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              required
            >
              <option value="" disabled>
                Seleccioná un cliente…
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="cliente@empresa.com"
              required
            />
          </Field>
          <Field label="Contraseña" required hint="Mínimo 8 caracteres.">
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </Field>
          {createError && <p className="text-xs text-red-500">{createError}</p>}
        </form>
      </Modal>
    </div>
  );
}
