import { useLocation } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/work-orders': 'Órdenes de Trabajo',
  '/work-orders/create': 'Nueva Orden',
  '/planning': 'Planificación',
  '/timesheets': 'Parte de Horas',
  '/crews': 'Cuadrillas',
  '/workers': 'Trabajadores',
  '/subcontractors': 'Subcontratistas',
  '/vehicles': 'Vehículos',
  '/materials': 'Materiales',
  '/clients': 'Clientes',
  '/locations': 'Ubicaciones',
  '/contracts': 'Contratos',
  '/reports': 'Reportes',
  '/settings': 'Configuración',
  '/portal-access': 'Portal de Clientes',
};

function titleFor(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  const base = '/' + pathname.split('/')[1];
  return TITLES[base] ?? 'ObraFlow';
}

export function Header() {
  const { pathname } = useLocation();

  return (
    <header className="h-14 flex-shrink-0 bg-white border-b border-border flex items-center gap-4 px-6">
      <h1 className="text-sm font-semibold text-text-primary">{titleFor(pathname)}</h1>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar órdenes, clientes..."
          className="w-56 xl:w-72 pl-9 pr-3 py-2 text-sm bg-surface-secondary border border-border rounded-lg text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
        />
      </div>
      <button className="relative p-2 text-text-secondary hover:text-text-primary transition-colors">
        <Bell className="h-4.5 w-4.5" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand" />
      </button>
    </header>
  );
}
