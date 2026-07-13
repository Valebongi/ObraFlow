import { useCallback, useEffect, useState } from 'react';
import { Building2, Shield, Bell, Palette, Save } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

type Tab = 'org' | 'security' | 'notifications' | 'appearance';

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: 'org', label: 'Organización', icon: Building2 },
  { id: 'security', label: 'Seguridad', icon: Shield },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'appearance', label: 'Apariencia', icon: Palette },
];

interface Org {
  name: string;
  plan?: string;
  phone?: string;
  address?: string;
  website?: string;
}

export default function SettingsPage() {
  const user = useAuth((s) => s.user);
  const [tab, setTab] = useState<Tab>('org');

  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<Org>({ name: '', plan: 'STARTER' });
  const [form, setForm] = useState<Org>({ name: '', phone: '', address: '', website: '' });
  const [savingOrg, setSavingOrg] = useState(false);
  const [orgMsg, setOrgMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadOrg = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/organization');
      setOrg(data);
      setForm({
        name: data.name ?? '',
        phone: data.phone ?? '',
        address: data.address ?? '',
        website: data.website ?? '',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrg();
  }, [loadOrg]);

  const saveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOrg(true);
    setOrgMsg(null);
    try {
      await api.patch('/organization', { name: form.name });
      setOrgMsg({ type: 'ok', text: 'Cambios guardados correctamente.' });
      await loadOrg();
    } catch (err) {
      setOrgMsg({ type: 'err', text: apiErrorMessage(err, 'No se pudieron guardar los cambios') });
    } finally {
      setSavingOrg(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPwdMsg(null);
    if (pwd.newPassword !== pwd.confirm) {
      setPwdMsg({ type: 'err', text: 'Las contraseñas no coinciden.' });
      return;
    }
    setSavingPwd(true);
    try {
      await api.patch(`/users/${user.id}/password`, {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
      setPwdMsg({ type: 'ok', text: 'Contraseña actualizada correctamente.' });
    } catch (err) {
      setPwdMsg({ type: 'err', text: apiErrorMessage(err, 'No se pudo cambiar la contraseña') });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="p-6 flex-1">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Configuración</h1>
        <div className="flex gap-6">
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {TABS.map(({ id, label, icon: Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left ${
                      active
                        ? 'bg-dark text-white'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary'
                    }`}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-brand' : ''}`} />
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner className="h-6 w-6" />
              </div>
            ) : tab === 'org' ? (
              <>
                <div className="bg-white rounded-xl border border-border shadow-xs p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-text-primary">Datos de la organización</h2>
                    {org.plan && (
                      <span className="inline-flex items-center gap-1.5 font-medium border rounded-full px-2.5 py-1 text-xs bg-brand-light text-brand-dark border-brand/30">
                        {org.plan}
                      </span>
                    )}
                  </div>
                  <form onSubmit={saveOrg} className="space-y-4">
                    <Field label="Razón social" required>
                      <Input
                        name="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </Field>
                    <Field label="Teléfono">
                      <Input
                        name="phone"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+54 11 1234-5678"
                      />
                    </Field>
                    <Field label="Dirección">
                      <Input
                        name="address"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Av. Corrientes 1234, CABA"
                      />
                    </Field>
                    <Field label="Sitio web">
                      <Input
                        name="website"
                        value={form.website}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                        placeholder="https://empresa.com"
                      />
                    </Field>
                    {orgMsg && (
                      <p className={`text-xs ${orgMsg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {orgMsg.text}
                      </p>
                    )}
                    <div className="flex justify-end">
                      <Button type="submit" disabled={savingOrg}>
                        <Save className="h-3.5 w-3.5" />
                        {savingOrg ? 'Guardando…' : 'Guardar cambios'}
                      </Button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-xl border border-border shadow-xs p-5">
                  <h2 className="font-semibold text-text-primary mb-4">Mi cuenta</h2>
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-dark rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-brand font-bold text-xl">
                        {(user?.name ?? '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{user?.name}</p>
                      <p className="text-sm text-text-muted">{user?.email}</p>
                      <span className="inline-flex items-center gap-1.5 font-medium border rounded-full px-2 py-0.5 text-2xs bg-brand-light text-brand-dark border-brand/30 mt-1">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : tab === 'security' ? (
              <div className="bg-white rounded-xl border border-border shadow-xs p-5">
                <h2 className="font-semibold text-text-primary mb-4">Cambiar contraseña</h2>
                <form onSubmit={savePassword} className="space-y-4">
                  <Field label="Contraseña actual" required>
                    <Input
                      type="password"
                      value={pwd.currentPassword}
                      onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
                      required
                    />
                  </Field>
                  <Field
                    label="Nueva contraseña"
                    required
                    hint="Mínimo 8 caracteres, con mayúscula, minúscula y número."
                  >
                    <Input
                      type="password"
                      value={pwd.newPassword}
                      onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Confirmar nueva contraseña" required>
                    <Input
                      type="password"
                      value={pwd.confirm}
                      onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                      required
                    />
                  </Field>
                  {pwdMsg && (
                    <p className={`text-xs ${pwdMsg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {pwdMsg.text}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button type="submit" disabled={savingPwd}>
                      <Save className="h-3.5 w-3.5" />
                      {savingPwd ? 'Guardando…' : 'Actualizar contraseña'}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-border shadow-xs p-5">
                <h2 className="font-semibold text-text-primary mb-2">
                  {tab === 'notifications' ? 'Notificaciones' : 'Apariencia'}
                </h2>
                <p className="text-sm text-text-muted">Próximamente.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
