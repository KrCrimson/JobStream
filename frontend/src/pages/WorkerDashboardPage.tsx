import React, { useEffect, useState } from 'react';
import { Card, Button } from '@/components/UI';
import { Clock, CheckCircle, XCircle, Phone, User, Building2, LogOut } from 'lucide-react';
import { turnoService, Turno } from '@/services/turnoService';
import { trabajadorService } from '@/services/trabajadorService';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const WorkerDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [waitingTurns, setWaitingTurns] = useState<Turno[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Turno | null>(null);
  const [calledTurn, setCalledTurn] = useState<Turno | null>(null);
  const [loading, setLoading] = useState(true);
  const [myServiceAreas, setMyServiceAreas] = useState<string[]>([]);
  const [workerId, setWorkerId] = useState<string>('');

  useEffect(() => {
    loadWorkerData();
  }, []);

  useEffect(() => {
    if (myServiceAreas.length > 0) {
      loadTurns();
      const interval = setInterval(loadTurns, 5000);
      return () => clearInterval(interval);
    }
  }, [myServiceAreas, workerId]);

  const loadWorkerData = async () => {
    try {
      console.log('👤 Cargando datos del trabajador...');
      const workerData = await trabajadorService.getMe();
      console.log('✅ Datos del trabajador:', workerData);
      setMyServiceAreas(workerData.serviceAreas || []);
      setWorkerId(workerData._id);
    } catch (error) {
      console.error('❌ Error al cargar datos del trabajador:', error);
      toast.error('Error al cargar áreas asignadas');
    }
  };

  const loadTurns = async () => {
    try {
      console.log('🔄 Cargando turnos...');
      console.log('📍 Mis áreas:', myServiceAreas);
      const allTurns = await turnoService.getAll();
      console.log('📊 Todos los turnos:', allTurns);
      
      const myAreaTurns = allTurns.filter(t => 
        myServiceAreas.includes(t.serviceAreaCode)
      );
      console.log('🎯 Turnos de mis áreas:', myAreaTurns);

      const current = myAreaTurns.find(t => 
        t.status === 'in-progress' && t.workerId === workerId
      );
      setCurrentTurn(current || null);

      const called = myAreaTurns.find(t => 
        t.status === 'called' && t.workerId === workerId
      );
      setCalledTurn(called || null);

      const waiting = myAreaTurns
        .filter(t => t.status === 'waiting')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      console.log('⏳ Turnos en espera:', waiting);
      setWaitingTurns(waiting);
    } catch (error) {
      console.error('Error al cargar turnos:', error);
      toast.error('Error al cargar turnos');
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async (serviceAreaCode: string) => {
    try {
      if (!workerId) {
        toast.error('Datos del trabajador no disponibles');
        return;
      }

      const turn = await turnoService.callNext(serviceAreaCode);
      if (turn) {
        toast.success(`Turno ${turn.turnNumber} llamado`);
        loadTurns();
      } else {
        toast('No hay turnos en espera');
      }
    } catch (error) {
      console.error('Error al llamar turno:', error);
      toast.error('Error al llamar turno');
    }
  };

  const handleStartAttention = async (turnId: string) => {
    try {
      await turnoService.start(turnId);
      toast.success('Atención iniciada');
      loadTurns();
    } catch (error) {
      console.error('Error al iniciar atención:', error);
      toast.error('Error al iniciar atención');
    }
  };

  const handleComplete = async (turnId: string) => {
    try {
      await turnoService.complete(turnId);
      toast.success('Turno completado');
      loadTurns();
    } catch (error) {
      console.error('Error al completar turno:', error);
      toast.error('Error al completar turno');
    }
  };

  const handleCancel = async (turnId: string) => {
    if (!confirm('¿Cancelar este turno?')) return;
    
    try {
      await turnoService.cancel(turnId);
      toast.success('Turno cancelado');
      loadTurns();
    } catch (error) {
      console.error('Error al cancelar turno:', error);
      toast.error('Error al cancelar turno');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Sesión cerrada');
  };

  const getServiceAreaName = (code: string) => {
    const areas: Record<string, string> = {
      'CA': 'Caja',
      'FA': 'Farmacia',
    };
    return areas[code] || code;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">👋 Hola, {user?.name}</h1>
            <p className="text-blue-100">Panel de Atención al Cliente</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="secondary"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {calledTurn && (
        <Card className="p-6 bg-yellow-50 border-2 border-yellow-500">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-yellow-700">
            <Phone className="w-6 h-6" />
            Turno Llamado
          </h2>
          
          <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Número de Turno</p>
                <p className="text-5xl font-bold text-yellow-600">{calledTurn.turnNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Área</p>
                <p className="text-xl font-semibold text-gray-900">
                  {getServiceAreaName(calledTurn.serviceAreaCode)}
                </p>
              </div>
            </div>

            {calledTurn.customerData && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Cliente</p>
                <p className="font-medium">
                  {calledTurn.customerData.name} {calledTurn.customerData.lastName}
                </p>
                {calledTurn.customerData.phone && (
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Phone className="w-4 h-4" />
                    {calledTurn.customerData.phone}
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={() => handleStartAttention(calledTurn._id)}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
              size="lg"
            >
              <User className="w-5 h-5 mr-2" />
              Iniciar Atención
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <User className="w-6 h-6" />
          Turno en Atención
        </h2>
        
        {currentTurn ? (
          <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Número de Turno</p>
                <p className="text-5xl font-bold text-blue-600">{currentTurn.turnNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Área</p>
                <p className="text-xl font-semibold text-gray-900">
                  {getServiceAreaName(currentTurn.serviceAreaCode)}
                </p>
              </div>
            </div>

            {currentTurn.customerData && (
              <div className="mb-4 p-3 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Cliente</p>
                <p className="font-medium">
                  {currentTurn.customerData.name} {currentTurn.customerData.lastName}
                </p>
                {currentTurn.customerData.phone && (
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Phone className="w-4 h-4" />
                    {currentTurn.customerData.phone}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => handleComplete(currentTurn._id)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Completar Atención
              </Button>
              <Button
                onClick={() => handleCancel(currentTurn._id)}
                variant="secondary"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-lg">No hay turno en atención</p>
            <p className="text-gray-500 text-sm mt-1">Llama al siguiente turno para comenzar</p>
          </div>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {myServiceAreas.map(areaCode => {
          const areaWaitingTurns = waitingTurns.filter(t => t.serviceAreaCode === areaCode);
          
          return (
            <Card key={areaCode} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold">{getServiceAreaName(areaCode)}</h3>
                </div>
                <span className="text-3xl font-bold text-blue-600">
                  {areaWaitingTurns.length}
                </span>
              </div>

              <Button
                onClick={() => handleCallNext(areaCode)}
                disabled={areaWaitingTurns.length === 0 || !!currentTurn || !!calledTurn}
                className="w-full mb-4"
              >
                <Phone className="w-5 h-5 mr-2" />
                Llamar Siguiente Turno
              </Button>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {areaWaitingTurns.length > 0 ? (
                  areaWaitingTurns.slice(0, 5).map((turn, index) => (
                    <div
                      key={turn._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <div>
                          <p className="font-semibold text-blue-600">{turn.turnNumber}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(turn.createdAt).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      {turn.customerData && (
                        <p className="text-sm text-gray-600">
                          {turn.customerData.name}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">Sin turnos en espera</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
