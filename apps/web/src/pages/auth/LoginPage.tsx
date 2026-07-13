import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { apiErrorMessage } from '@/lib/api';

const DEMO_EMAIL = 'admin@demo.com';
const DEMO_PASSWORD = 'Admin123!';

const STATS = [
  { value: '98%', label: 'Entregas en tiempo' },
  { value: '3x', label: 'Más eficiente' },
  { value: '50+', label: 'Empresas confían' },
  { value: '24/7', label: 'Disponibilidad' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
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
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(apiErrorMessage(err, 'Credenciales inválidas'));
    } finally {
      setLoading(false);
    }
  }

  function useDemo() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark text-white relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand/5 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-dark">
            <Wrench className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">ObraFlow</span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight">
            Gestión de obra
            <br />
            <span className="text-brand">inteligente</span>
          </h1>
          <p className="mt-4 text-gray-400 max-w-sm">
            Planificá, asigná y controlá todas tus órdenes de trabajo desde un solo lugar.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 max-w-md">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-2xl font-bold text-brand">{s.value}</p>
                <p className="text-sm text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-gray-500">© 2025 ObraFlow. Todos los derechos reservados.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-secondary">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-border p-8">
          <h2 className="text-2xl font-bold text-text-primary">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-text-secondary">Ingresá con tu cuenta de empresa</p>

          <button
            onClick={useDemo}
            type="button"
            className="mt-6 w-full flex items-center justify-between gap-3 rounded-xl bg-brand-light border border-brand/30 px-4 py-3 text-left hover:bg-brand-light/70 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-brand-dark">Demo disponible</p>
              <p className="text-xs text-brand-dark/80">
                {DEMO_EMAIL} · {DEMO_PASSWORD}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-dark whitespace-nowrap">
              Usar demo <ArrowRight className="h-3 w-3" />
            </span>
          </button>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@empresa.com"
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
              className="w-full rounded-lg bg-dark text-white py-3 text-sm font-semibold hover:bg-dark-hover transition-colors disabled:opacity-60"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="font-semibold text-brand-dark hover:underline">
              Crear organización
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
