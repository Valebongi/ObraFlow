import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  Clock,
  HardHat,
  Users,
  Briefcase,
  Truck,
  Package,
  Building2,
  MapPin,
  FileText,
  Shield,
  ChartColumn,
  CreditCard,
  Settings,
  LogOut,
  Wrench,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/store/auth';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  { items: [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }] },
  {
    title: 'Operaciones',
    items: [
      { label: 'Órdenes de Trabajo', to: '/work-orders', icon: ClipboardList },
      { label: 'Planificación', to: '/planning', icon: CalendarDays },
      { label: 'Parte de Horas', to: '/timesheets', icon: Clock },
    ],
  },
  {
    title: 'Recursos',
    items: [
      { label: 'Cuadrillas', to: '/crews', icon: HardHat },
      { label: 'Trabajadores', to: '/workers', icon: Users },
      { label: 'Subcontratistas', to: '/subcontractors', icon: Briefcase },
      { label: 'Vehículos', to: '/vehicles', icon: Truck },
      { label: 'Materiales', to: '/materials', icon: Package },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { label: 'Clientes', to: '/clients', icon: Building2 },
      { label: 'Ubicaciones', to: '/locations', icon: MapPin },
      { label: 'Contratos', to: '/contracts', icon: FileText },
      { label: 'Usuarios', to: '/users', icon: Shield },
      { label: 'Reportes', to: '/reports', icon: ChartColumn },
      { label: 'Facturación', to: '/billing', icon: CreditCard },
    ],
  },
];

const linkBase =
  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 mb-0.5';
const linkActive = 'bg-white/10 text-white';
const linkInactive = 'text-gray-400 hover:text-white hover:bg-white/5';

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const initial = (user?.name || user?.email || '?').charAt(0).toUpperCase();

  return (
    <aside
      className={`flex flex-col h-screen bg-dark border-r border-dark-muted flex-shrink-0 transition-all duration-200 ${
        collapsed ? 'w-20' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-dark flex-shrink-0">
          <Wrench className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight truncate">ObraFlow</p>
            <p className="text-xs text-gray-500 truncate">Organización</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2">
        {SECTIONS.map((section, i) => (
          <div key={i} className="mb-2">
            {section.title && !collapsed && (
              <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {section.title}
              </p>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive} ${collapsed ? 'justify-center' : ''}`
                }
              >
                <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-dark-muted px-3 py-3 flex-shrink-0">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkInactive} ${collapsed ? 'justify-center' : ''}`
          }
        >
          <Settings className="h-4.5 w-4.5 flex-shrink-0" />
          {!collapsed && <span>Configuración</span>}
        </NavLink>
        <button
          onClick={() => logout()}
          className={`w-full ${linkBase} ${linkInactive} ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-dark text-sm font-bold flex-shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Usuario'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-1 text-xs text-gray-500 hover:text-white transition-colors"
        >
          <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}
