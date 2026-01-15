import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/UI';
import { LayoutDashboard, Users, Building2, Settings, LogOut, Activity, Ticket, Monitor } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const navigation = [
    { name: 'Panel de Control', path: '/', icon: LayoutDashboard },
    { name: 'Turnos', path: '/turnos', icon: Ticket },
    { name: 'Áreas de Servicio', path: '/areas', icon: Building2 },
    { name: 'Trabajadores', path: '/trabajadores', icon: Users },
    { name: 'Configuración', path: '/configuracion', icon: Settings },
  ];

  const publicLinks = [
    { name: '📺 Pantalla de Turnos', path: '/display', external: true },
    { name: '🎫 Kiosco Cliente', path: '/kiosco', external: true },
  ];
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Activity className="w-8 h-8 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">JobStream</h1>
              <span className="text-sm text-gray-500 ml-2">Sistema de Turnos</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.name} ({user?.role === 'admin' ? 'Administrador' : user?.role === 'worker' ? 'Trabajador' : 'Visualizador'})
              </span>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <nav className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-6">
              {/* Navegación principal */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Menú Principal
                </h3>
                <ul className="space-y-2">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-primary-100 text-primary-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Enlaces públicos */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Vistas Públicas
                </h3>
                <ul className="space-y-2">
                  {publicLinks.map((item) => (
                    <li key={item.path}>
                      <a
                        href={item.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Monitor className="w-5 h-5" />
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </nav>
          
          {/* Main content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
