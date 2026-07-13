import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Pencil,
  Users as UsersIcon,
} from 'lucide-react';
import { UserRole } from '@obraflow/shared';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { USER_ROLE_LABEL } from '@/lib/labels';
import { formatDate, formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { Spinner } from '@/components/ui/Spinner';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
}

type RoleTone = 'gray' | 'yellow' | 'green' | 'blue' | 'red' | 'purple' | 'orange';

const ROLE_TONE: Record<UserRole, RoleTone> = {
  [UserRole.ORG_ADMIN]: 'yellow',
  [UserRole.PLANNER]: 'blue',
  [UserRole.SUPERVISOR]: 'purple',
  [UserRole.FIELD_LEAD]: 'orange',
  [UserRole.VIEWER]: 'gray',
};

const ROLE_OPTIONS = Object.values(UserRole);

interface CreateForm {
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

const EMPTY_CREATE: CreateForm = {
  name: '',
  email: '',
  role: UserRole.PLANNER,
  password: '',
};

export default function UsersPage() {
  const currentUser = useAuth((s) => s.user);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>(UserRole.PLANNER);
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', { params: { page: 1, limit: 100 } });
      setRows(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const openCreate = () => {
    setCreateForm(EMPTY_CREATE);
    setCreateError(null);
    setCreateOpen(true);
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await api.post('/users', createForm);
      setCreateOpen(false);
      await load();
    } catch (err) {
      setCreateError(apiErrorMessage(err, 'No se pudo crear el usuario'));
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (u: UserRow) => {
    setEditing(u);
    setEditName(u.name);
    setEditRole(u.role);
    setEditActive(u.isActive);
    setEditError(null);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setEditError(null);
    try {
      await api.patch(`/users/${editing.id}`, {
        name: editName,
        role: editRole,
        isActive: editActive,
      });
      setEditing(null);
      await load();
    } catch (err) {
      setEditError(apiErrorMessage(err, 'No se pudo actualizar el usuario'));
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    if (!editing) return;
    if (!window.confirm(`¿Desactivar el acceso de ${editing.name}?`)) return;
    setSaving(true);
    setEditError(null);
    try {
      await api.delete(`/users/${editing.id}`);
      setEditing(null);
      await load();
    } catch (err) {
      setEditError(apiErrorMessage(err, 'No se pudo desactivar el usuario'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 flex-1">
      <PageHeader
        title="Usuarios"
        subtitle={`${rows.length} usuarios en la organización`}
        actions={
          <>
            <Button variant="secondary" onClick={load}>
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo usuario
            </Button>
          </>
        }
      />

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
        <ShieldCheck className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          <strong>Jerarquía de roles:</strong> ORG_ADMIN &gt; Planificador &gt; Supervisor &gt; Capataz &gt;
          Visualizador. Los roles de mayor nivel tienen acceso a más funcionalidades.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-xs mb-4 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <Input
            placeholder="Buscar por nombre o email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="Sin resultados"
            description="Probá ajustando los filtros de búsqueda."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH sortable>Usuario</TH>
                <TH style={{ width: 150 }}>Rol</TH>
                <TH style={{ width: 100 }}>Estado</TH>
                <TH style={{ width: 130 }}>Último acceso</TH>
                <TH style={{ width: 110 }}>Alta</TH>
                <TH style={{ width: 80 }} />
              </TR>
            </THead>
            <TBody>
              {filtered.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <TR key={u.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 bg-brand">
                          <span className="text-xs font-bold text-dark">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-text-primary">{u.name}</p>
                            {isSelf && (
                              <span className="inline-flex items-center gap-1.5 font-medium border rounded-full px-2 py-0.5 text-2xs bg-brand-light text-brand-dark border-brand/30">
                                Tú
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-muted">{u.email}</p>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <Badge tone={ROLE_TONE[u.role]}>{USER_ROLE_LABEL[u.role]}</Badge>
                    </TD>
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-tertiary rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </div>

      {/* Create */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nuevo usuario"
        description="Invitá a un integrante a tu organización."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button type="submit" form="user-create-form" disabled={creating}>
              {creating ? 'Creando…' : 'Crear usuario'}
            </Button>
          </>
        }
      >
        <form id="user-create-form" onSubmit={submitCreate} className="space-y-4">
          <Field label="Nombre" required>
            <Input
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="Juan Pérez"
              required
            />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              placeholder="juan@empresa.com"
              required
            />
          </Field>
          <Field label="Rol" required>
            <Select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {USER_ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Contraseña"
            required
            hint="Mínimo 8 caracteres, con mayúscula, minúscula y número."
          >
            <Input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </Field>
          {createError && <p className="text-xs text-red-500">{createError}</p>}
        </form>
      </Modal>

      {/* Edit */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar usuario"
        description={editing?.email}
        footer={
          <>
            <Button variant="danger" onClick={deactivate} disabled={saving} className="mr-auto">
              Desactivar
            </Button>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form="user-edit-form" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </>
        }
      >
        <form id="user-edit-form" onSubmit={submitEdit} className="space-y-4">
          <Field label="Nombre" required>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </Field>
          <Field label="Rol" required>
            <Select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {USER_ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Estado">
            <Select
              value={editActive ? 'active' : 'inactive'}
              onChange={(e) => setEditActive(e.target.value === 'active')}
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </Select>
          </Field>
          {editError && <p className="text-xs text-red-500">{editError}</p>}
        </form>
      </Modal>
    </div>
  );
}
