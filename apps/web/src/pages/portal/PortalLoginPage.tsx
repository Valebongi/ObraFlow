import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Eye, EyeOff } from 'lucide-react';
import {
  portalApi,
  PORTAL_TOKEN_KEY,
  PORTAL_USER_KEY,
} from '@/lib/portalApi';
import { apiErrorMessage } from '@/lib/api';

export default function PortalLoginPage() {
  const navigate = useNavigate();
  const [orgCode, setOrgCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await portalApi.post('/portal/auth/login', {
        orgCode: orgCode.trim(),
        email: email.trim(),
        password,
      });
      localStorage.setItem(PORTAL_TOKEN_KEY, data.accessToken);
      localStorage.setItem(PORTAL_USER_KEY, JSON.stringify(data.user));
      navigate('/portal/work-orders', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Credenciales inválidas'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand flex items-center justify-center">
              <Wrench className="h-5 w-5 text-dark" />
            </div>
            <span className="text-2xl font-bold text-text-primary">ObraFlow</span>
          </div>
          <p className="text-text-secondary text-sm mt-2">Portal de Clientes</p>
        </div>

        <div className="rounded-2xl bg-white shadow-xl border border-border p-8">
          <h2 className="text-2xl font-bold text-text-primary">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Accedé para seguir el avance de tus obras.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Código de organización
              </label>
              <input
                required
                value={orgCode}
                onChange={(e) => setOrgCode(e.target.value)}
                placeholder="constructora-abc"
                autoFocus
                className="w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@empresa.com"
                className="w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 text-sm bg-white border border-border rounded-lg text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand text-dark py-3 text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-sm mt-6">
          © 2025 ObraFlow. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
