import React, { useEffect, useState } from 'react';
import { Card, Button } from '@/components/UI';
import { Clock, CheckCircle, XCircle, AlertCircle, User, Building2, Calendar, Filter } from 'lucide-react';
import { turnoService, Turno } from '@/services/turnoService';
import { areaService, Area } from '@/services/areaService';
import toast from 'react-hot-toast';

type FilterStatus = 'all' | 'waiting' | 'in-progress' | 'completed' | 'cancelled';

export const TurnosPage: React.FC = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Actualizar cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [turnosData, areasData] = await Promise.all([
        turnoService.getAll(),
        areaService.getAll(),
      ]);
      setTurnos(turnosData);
      setAreas(areasData);
    } catch (error) {
      console.error('Error al cargar turnos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTurn = async (id: string) => {
    if (!confirm('¿Cancelar este turno?')) return;
    try {
      await turnoService.cancel(id);
      toast.success('Turno cancelado');
      loadData();
    } catch (error) {
      toast.error('Error al cancelar turno');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'in-progress':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'En Espera';
      case 'in-progress': return 'En Atención';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredTurnos = turnos.filter(turno => {
    const statusMatch = filterStatus === 'all' || turno.status === filterStatus;
    const areaMatch = filterArea === 'all' || turno.serviceAreaCode === filterArea;
    return statusMatch && areaMatch;
  });

  const stats = {
    total: turnos.length,
    waiting: turnos.filter(t => t.status === 'waiting').length,
    inProgress: turnos.filter(t => t.status === 'in-progress').length,
    completed: turnos.filter(t => t.status === 'completed').length,
    cancelled: turnos.filter(t => t.status === 'cancelled').length,
  };

  const formatTime = (date?: string) => {
    if (!date) return '--';
    return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date?: string) => {
    if (!date) return '--';
    return new Date(date).toLocaleDateString('es-ES');
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎫 Gestión de Turnos</h1>
          <p className="text-gray-600 mt-1">Monitorea todos los turnos en tiempo real</p>
        </div>
        <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Hoy</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">En Espera</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.waiting}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">En Atención</p>
          <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Completados</p>
          <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Cancelados</p>
          <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
        </Card>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="all">Todos los estados</option>
                <option value="waiting">En Espera</option>
                <option value="in-progress">En Atención</option>
                <option value="completed">Completados</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Área de Servicio</label>
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="all">Todas las áreas</option>
                {areas.map(area => (
                  <option key={area._id} value={area.code}>{area.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de turnos */}
      <div className="space-y-3">
        {filteredTurnos.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 text-lg">No hay turnos que mostrar</p>
            <p className="text-gray-400 text-sm mt-2">Los turnos generados aparecerán aquí</p>
          </Card>
        ) : (
          filteredTurnos.map((turno) => (
            <Card key={turno._id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Número de turno */}
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-white">{turno.ticketNumber}</span>
                  </div>

                  {/* Información principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {turno.customer?.firstName || 'Cliente'} {turno.customer?.lastName || ''}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(turno.status)}`}>
                        {getStatusIcon(turno.status)}
                        <span className="ml-2">{getStatusText(turno.status)}</span>
                      </span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span>{turno.serviceAreaName} ({turno.serviceAreaCode})</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(turno.createdAt)} - {formatTime(turno.createdAt)}</span>
                      </div>
                      {turno.workerName && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span>{turno.workerName}</span>
                        </div>
                      )}
                    </div>

                    {/* Información adicional */}
                    {turno.customer?.identificationNumber && (
                      <div className="mt-2 text-sm text-gray-500">
                        {turno.customer.identificationType}: {turno.customer.identificationNumber}
                      </div>
                    )}

                    {/* Tiempos */}
                    <div className="mt-3 flex gap-6 text-xs text-gray-500">
                      {turno.calledAt && (
                        <span>Llamado: {formatTime(turno.calledAt)}</span>
                      )}
                      {turno.startedAt && (
                        <span>Iniciado: {formatTime(turno.startedAt)}</span>
                      )}
                      {turno.completedAt && (
                        <span>Completado: {formatTime(turno.completedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                {turno.status === 'waiting' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelTurn(turno._id)}
                    className="ml-4"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Indicador de actualización */}
      <div className="text-center text-sm text-gray-500">
        Actualización automática cada 5 segundos
      </div>
    </div>
  );
};
