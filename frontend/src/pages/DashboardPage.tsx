import React, { useEffect, useState } from 'react';
import { Card } from '@/components/UI';
import { Activity, CheckCircle, Clock, Users, Building2, AlertCircle } from 'lucide-react';

interface TurnStats {
  turnsToday: number;
  waitingTurns: number;
  attendingTurns: number;
  completedTurns: number;
  cancelledTurns: number;
  averageWaitTime: number;
  activeWorkers: number;
  totalServiceAreas: number;
}

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<TurnStats>({
    turnsToday: 0,
    waitingTurns: 0,
    attendingTurns: 0,
    completedTurns: 0,
    cancelledTurns: 0,
    averageWaitTime: 0,
    activeWorkers: 0,
    totalServiceAreas: 0,
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/turns/stats/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        const data = result.data;
        
        setStats({
          turnsToday: data.totalToday || 0,
          waitingTurns: data.waiting || 0,
          attendingTurns: data.inProgress || 0,
          completedTurns: data.completed || 0,
          cancelledTurns: data.cancelled || 0,
          averageWaitTime: data.averageWaitTime || 0,
          activeWorkers: data.activeWorkers || 0,
          totalServiceAreas: data.totalServiceAreas || 0,
        });
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    description: string;
  }> = ({ title, value, icon, color, description }) => (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">{description}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      </div>
    </Card>
  );
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📊 Panel de Control</h1>
        <p className="text-gray-600 mt-1">Vista general del sistema de turnos</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Turnos Hoy"
          value={stats.turnsToday}
          icon={<Activity className="w-6 h-6 text-blue-600" />}
          color="bg-blue-100"
          description="Total de turnos generados en el día actual"
        />
        
        <StatCard
          title="En Espera"
          value={stats.waitingTurns}
          icon={<Clock className="w-6 h-6 text-yellow-600" />}
          color="bg-yellow-100"
          description="Turnos pendientes de ser atendidos"
        />
        
        <StatCard
          title="En Atención"
          value={stats.attendingTurns}
          icon={<Activity className="w-6 h-6 text-purple-600" />}
          color="bg-purple-100"
          description="Turnos siendo atendidos actualmente"
        />
        
        <StatCard
          title="Completados"
          value={stats.completedTurns}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
          description="Turnos atendidos exitosamente hoy"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Cancelados"
          value={stats.cancelledTurns}
          icon={<AlertCircle className="w-6 h-6 text-red-600" />}
          color="bg-red-100"
          description="Turnos cancelados en el día"
        />
        
        <StatCard
          title="Trabajadores Activos"
          value={stats.activeWorkers}
          icon={<Users className="w-6 h-6 text-indigo-600" />}
          color="bg-indigo-100"
          description="Empleados atendiendo actualmente"
        />
        
        <StatCard
          title="Áreas de Servicio"
          value={stats.totalServiceAreas}
          icon={<Building2 className="w-6 h-6 text-cyan-600" />}
          color="bg-cyan-100"
          description="Total de áreas configuradas"
        />
        
        <StatCard
          title="Tiempo Promedio"
          value={stats.averageWaitTime}
          icon={<Clock className="w-6 h-6 text-orange-600" />}
          color="bg-orange-100"
          description="Minutos de espera promedio"
        />
      </div>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">⚡ Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition">
            <h3 className="font-semibold text-blue-900">👥 Gestionar Trabajadores</h3>
            <p className="text-sm text-blue-700 mt-1">Administrar empleados y asignaciones</p>
          </button>
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition">
            <h3 className="font-semibold text-green-900">🏢 Gestionar Áreas</h3>
            <p className="text-sm text-green-700 mt-1">Configurar áreas de servicio</p>
          </button>
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition">
            <h3 className="font-semibold text-purple-900">⚙️ Configuración</h3>
            <p className="text-sm text-purple-700 mt-1">Ajustes del sistema</p>
          </button>
        </div>
      </Card>
      
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          💡 Guía del Panel de Control
        </h2>
        <p className="text-gray-700 mb-4">
          Este panel te muestra el estado en tiempo real de tu sistema de turnos. Se actualiza automáticamente cada 5 segundos.
        </p>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              📊 Indicadores Principales
            </h3>
            <div className="space-y-2 text-sm ml-5">
              <div>
                <p className="font-medium text-gray-800">• Turnos Hoy</p>
                <p className="text-gray-600">Total de turnos generados desde las 00:00. Incluye todos los estados: completados, cancelados y en proceso.</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">• En Espera</p>
                <p className="text-gray-600">Clientes que sacaron turno y están esperando en sala. Si este número es muy alto, considera agregar más trabajadores.</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">• En Atención</p>
                <p className="text-gray-600">Turnos siendo atendidos ahora mismo. Indica cuántos trabajadores están ocupados.</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">• Completados</p>
                <p className="text-gray-600">Turnos finalizados exitosamente hoy. Mide la productividad del equipo.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              📈 Métricas de Rendimiento
            </h3>
            <div className="space-y-2 text-sm ml-5">
              <div>
                <p className="font-medium text-gray-800">• Tiempo Promedio de Espera</p>
                <p className="text-gray-600">Minutos que los clientes esperan en promedio. Un tiempo menor a 15 minutos se considera óptimo.</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">• Cancelados</p>
                <p className="text-gray-600">Turnos que no fueron atendidos. Un número alto puede indicar tiempos de espera muy largos.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              🏢 Recursos del Sistema
            </h3>
            <div className="space-y-2 text-sm ml-5">
              <div>
                <p className="font-medium text-gray-800">• Trabajadores Activos</p>
                <p className="text-gray-600">Empleados que iniciaron sesión y pueden atender turnos. Compara este número con "En Atención" para ver disponibilidad.</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">• Áreas de Servicio</p>
                <p className="text-gray-600">Diferentes tipos de atención configurados (ej: Caja, Información, Atención General).</p>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h3 className="font-semibold text-amber-900 mb-2">⚠️ Recomendaciones</h3>
            <ul className="text-sm text-amber-800 space-y-1 ml-4">
              <li>• Si "En Espera" &gt; 10: Considera activar más trabajadores</li>
              <li>• Si "Tiempo Promedio" &gt; 20 min: Revisa la eficiencia de atención</li>
              <li>• Si "Cancelados" &gt; 5% de total: Los tiempos de espera son muy largos</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
