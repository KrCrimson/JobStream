import React, { useEffect, useState } from 'react';
import { Card } from '@/components/UI';
import { turnoService, Turno } from '@/services/turnoService';
import { configService } from '@/services/configService';

export const DisplayPage: React.FC = () => {
  const [currentTurn, setCurrentTurn] = useState<Turno | null>(null);
  const [nextTurns, setNextTurns] = useState<Turno[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(10); // Aumentado a 10 segundos
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
    loadConfig();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        loadData();
      }
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval, isLoading]);

  const loadConfig = async () => {
    try {
      const config = await configService.get();
      setRefreshInterval(config.displayConfig.autoRefreshInterval || 10);
    } catch (error) {
      console.error('Error loading config');
    }
  };

  const loadData = async () => {
    if (isLoading) return; // Prevenir llamadas duplicadas
    
    try {
      setIsLoading(true);
      console.log('🔄 Cargando turnos activos para display...');
      const activeTurns = await turnoService.getActive();
      console.log('📊 Turnos activos recibidos:', activeTurns);
      console.log('📋 Status de cada turno:', activeTurns.map(t => ({ turnNumber: t.turnNumber, status: t.status })));
      
      // Turno actual: el primero "called" o "in-progress"
      const current = activeTurns.find(t => t.status === 'called' || t.status === 'in-progress');
      console.log('🎯 Turno actual:', current);
      console.log('🔍 Buscando status "called" o "in-progress"');
      
      // Siguientes: los que están "waiting" ordenados por fecha
      const waiting = activeTurns
        .filter(t => t.status === 'waiting')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(0, 5);
      console.log('⏳ Turnos en espera:', waiting);
      setCurrentTurn(current || null);
      setNextTurns(waiting);
    } catch (error) {
      console.error('❌ Error cargando turnos para display:', error);
      // En caso de error, no actualizamos los datos existentes
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return 'text-green-400';
      case 'waiting': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-progress': return 'En Atención';
      case 'waiting': return 'En Espera';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-2">📺 Sistema de Turnos</h1>
          <p className="text-2xl text-gray-400">Esté atento a su turno</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Turno Actual */}
          <Card className="p-10 bg-gradient-to-br from-blue-900 to-blue-700 border-4 border-blue-500">
            <h2 className="text-4xl font-bold mb-6 text-white">🔔 Turno Actual</h2>
            {currentTurn ? (
              <>
                <div className="text-9xl font-bold text-center py-10 text-white">
                  {currentTurn.turnNumber || currentTurn.ticketNumber}
                </div>
                <div className="text-center">
                  <p className="text-3xl font-semibold text-blue-200 mb-2">
                    {currentTurn.serviceAreaName}
                  </p>
                  {currentTurn.workerName && (
                    <p className="text-xl text-blue-300">
                      Atendido por: {currentTurn.workerName}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-4xl text-blue-300">Sin turnos en atención</p>
                <p className="text-xl text-blue-400 mt-4">Esperando próximo turno...</p>
              </div>
            )}
          </Card>
          
          {/* Siguientes Turnos */}
          <Card className="p-10 bg-gray-800 border-2 border-gray-700">
            <h2 className="text-4xl font-bold mb-6 text-white">📋 Próximos Turnos</h2>
            <div className="space-y-4">
              {nextTurns.length > 0 ? (
                nextTurns.map((turno, index) => (
                  <div 
                    key={turno._id} 
                    className="flex justify-between items-center p-4 bg-gray-700 rounded-lg border-l-4 border-yellow-500"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-white">{index + 1}.</span>
                      <div>
                        <span className="text-3xl font-bold text-yellow-400">{turno.turnNumber || turno.ticketNumber}</span>
                        <p className="text-lg text-gray-400">{turno.serviceAreaName}</p>
                      </div>
                    </div>
                    <span className={`text-xl font-semibold ${getStatusColor(turno.status)}`}>
                      {getStatusText(turno.status)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-2xl text-gray-400">No hay turnos en espera</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-3 gap-6">
          <Card className="p-6 bg-gray-800 text-center">
            <p className="text-gray-400 text-lg mb-2">Total Atendidos Hoy</p>
            <p className="text-5xl font-bold text-green-400">--</p>
          </Card>
          <Card className="p-6 bg-gray-800 text-center">
            <p className="text-gray-400 text-lg mb-2">En Espera</p>
            <p className="text-5xl font-bold text-yellow-400">{nextTurns.length}</p>
          </Card>
          <Card className="p-6 bg-gray-800 text-center">
            <p className="text-gray-400 text-lg mb-2">Tiempo Est. Espera</p>
            <p className="text-5xl font-bold text-blue-400">
              {nextTurns.length > 0 ? `${nextTurns.length * 5}m` : '--'}
            </p>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Actualización automática cada {refreshInterval} segundos
          </p>
        </div>
      </div>
    </div>
  );
};
