import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wrench,
  Building2,
  User,
  CircleCheck,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { apiErrorMessage } from '@/lib/api';

const STEPS = [
  { key: 'org', label: 'Organización', icon: Building2 },
  { key: 'account', label: 'Tu cuenta', icon: User },
  { key: 'done', label: 'Listo', icon: CircleCheck },
];

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: 'Al menos 8 caracteres' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Una letra mayúscula' },
  { test: (p: string) => /[a-z]/.test(p), label: 'Una letra minúscula' },
  { test: (p: string) => /\d/.test(p), label: 'Un número' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuth((s) => s.register);

  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordValid = PASSWORD_RULES.every((r) => r.test(password));

  function goToAccount(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (orgName.trim().length < 2) {
      setError('Ingresá el nombre de tu organización.');
      return;
    }
    setStep(1);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) {
      setError('Ingresá tu nombre.');
      return;
    }
    if (!passwordValid) {
      setError('La contraseña no cumple con los requisitos.');
      return;
    }
    setLoading(true);
    try {
      await register({ orgName: orgName.trim(), name: name.trim(), email: email.trim(), password });
      setStep(2);
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setError(apiErrorMessage(err, 'No pudimos crear tu organización'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand flex items-center justify-center">
              <Wrench className="h-5 w-5 text-dark" />
            </div>
            <span className="text-2xl font-bold text-white">ObraFlow</span>
          </div>
          <p className="text-gray-400 text-sm mt-2">Crea tu organización gratis</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const complete = i < step;
            return (
              <div key={s.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
                      active
                        ? 'bg-brand/20 border-2 border-brand'
                        : complete
                        ? 'bg-brand border-2 border-brand'
                        : 'bg-dark-card border-2 border-dark-muted'
                    }`}
                  >
                    {complete ? (
                      <Check className="h-4 w-4 text-dark" />
                    ) : (
                      <Icon className={`h-4 w-4 ${active ? 'text-brand' : 'text-gray-600'}`} />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1.5 font-medium ${
                      active ? 'text-white' : complete ? 'text-brand' : 'text-gray-600'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-px w-16 mx-2 mb-5 transition-all ${
                      i < step ? 'bg-brand' : 'bg-dark-muted'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-dark-card border border-dark-muted rounded-2xl p-8 shadow-2xl">
          {step === 0 && (
            <form onSubmit={goToAccount}>
              <h2 className="text-xl font-bold text-white mb-1">Datos de la organización</h2>
              <p className="text-gray-400 text-sm mb-6">¿Cómo se llama tu empresa o equipo?</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-1.5">
                    Nombre de la organización *
                  </label>
                  <input
                    name="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Ej: Constructora ABC"
                    autoFocus
                    className="w-full bg-dark border border-dark-muted rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand transition-colors"
                  />
                </div>
              </div>
              {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                className="mt-6 w-full bg-brand text-dark font-bold py-3 rounded-xl hover:bg-brand/90 transition-colors flex items-center justify-center gap-2"
              >
                Continuar <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {step === 1 && (
            <form onSubmit={submit}>
              <h2 className="text-xl font-bold text-white mb-1">Creá tu cuenta</h2>
              <p className="text-gray-400 text-sm mb-6">Vas a ser el administrador de {orgName}.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-1.5">Tu nombre *</label>
                  <input
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    autoFocus
                    className="w-full bg-dark border border-dark-muted rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-1.5">Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan@empresa.com"
                    className="w-full bg-dark border border-dark-muted rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-1.5">Contraseña *</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPass ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-dark border border-dark-muted rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <ul className="mt-3 grid grid-cols-2 gap-1.5">
                    {PASSWORD_RULES.map((rule) => {
                      const ok = rule.test(password);
                      return (
                        <li
                          key={rule.label}
                          className={`flex items-center gap-1.5 text-xs ${
                            ok ? 'text-brand' : 'text-gray-500'
                          }`}
                        >
                          <Check
                            className={`h-3.5 w-3.5 ${ok ? 'text-brand' : 'text-gray-700'}`}
                          />
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(0);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-dark-muted px-4 py-3 text-sm font-medium text-gray-300 hover:bg-dark transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-brand text-dark font-bold py-3 rounded-xl hover:bg-brand/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? 'Creando...' : 'Crear organización'}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="text-center py-6">
              <div className="mx-auto h-14 w-14 rounded-full bg-brand/20 border-2 border-brand flex items-center justify-center">
                <CircleCheck className="h-7 w-7 text-brand" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-white">¡Listo, {name}!</h2>
              <p className="mt-1 text-sm text-gray-400">
                Tu organización <span className="text-white font-medium">{orgName}</span> fue creada.
                Te estamos llevando al panel...
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-brand hover:underline font-medium">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
