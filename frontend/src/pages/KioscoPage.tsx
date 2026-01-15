import React, { useState, useEffect } from 'react';
import { Card, Button } from '@/components/UI';
import { Ticket, AlertCircle } from 'lucide-react';
import { areaService, Area } from '@/services/areaService';
import { turnoService, CreateTurnoData } from '@/services/turnoService';
import { configService, SystemConfig } from '@/services/configService';
import toast from 'react-hot-toast';

export const KioscoPage: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [ticketGenerated, setTicketGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [validationData, setValidationData] = useState({
    firstName: '',
    lastName: '',
    identificationType: 'DNI',
    identificationNumber: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 Cargando datos del kiosco...');
      const [areasData, configData] = await Promise.all([
        areaService.getAll(),
        configService.get(),
      ]);
      console.log('📦 Áreas recibidas:', areasData);
      console.log('⚙️ Config recibida:', configData);
      setAreas(areasData.filter(a => a.isActive));
      setConfig(configData);
      
      // Si es modo único, seleccionar la primera área automáticamente
      if (configData.operationMode === 'single' && areasData.length > 0) {
        setSelectedArea(areasData[0]._id);
      }
    } catch (error) {
      console.error('❌ Error al cargar datos del kiosco:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTicket = async () => {
    if (!selectedArea) {
      toast.error('Selecciona un área de servicio');
      return;
    }

    if (config?.requireCustomerValidation) {
      if (!validationData.firstName || !validationData.lastName) {
        toast.error('Completa nombre y apellido');
        return;
      }
      if (config.validationType === 'dni' && !validationData.identificationNumber) {
        toast.error('Ingresa tu DNI');
        return;
      }
      if (config.validationType === 'phone' && !validationData.phone) {
        toast.error('Ingresa tu teléfono');
        return;
      }
      if (config.validationType === 'email' && !validationData.email) {
        toast.error('Ingresa tu email');
        return;
      }
    }

    try {
      console.log('🎫 Iniciando generación de turno...');
      console.log('📍 Área seleccionada:', selectedArea);
      
      // Buscar el área seleccionada para obtener su código
      const selectedAreaData = areas.find(a => a._id === selectedArea);
      console.log('📋 Datos del área:', selectedAreaData);
      
      if (!selectedAreaData) {
        toast.error('Área de servicio no encontrada');
        return;
      }

      const data: CreateTurnoData = {
        serviceAreaCode: selectedAreaData.code,
      };

      if (config?.requireCustomerValidation) {
        data.customerData = {
          name: validationData.firstName,
          lastName: validationData.lastName,
          idNumber: validationData.identificationNumber,
          phone: validationData.phone,
        };
      }

      console.log('📤 Enviando datos al backend:', data);
      const turno = await turnoService.create(data);
      console.log('✅ Turno creado:', turno);
      setTicketGenerated(turno.turnNumber || turno.ticketNumber || '');
      toast.success('¡Turno generado!');
      
      // Reset después de 10 segundos
      setTimeout(() => {
        setTicketGenerated(null);
        setSelectedArea(config?.operationMode === 'single' ? areas[0]?._id || '' : '');
        setValidationData({
          firstName: '',
          lastName: '',
          identificationType: 'DNI',
          identificationNumber: '',
          phone: '',
          email: '',
        });
      }, 10000);
    } catch (error) {
      console.error('❌ Error completo al generar turno:', error);
      console.error('❌ Response:', (error as any)?.response?.data);
      console.error('❌ Status:', (error as any)?.response?.status);
      console.error('❌ Validation errors:', (error as any)?.response?.data?.errors);
      
      const errorData = (error as any)?.response?.data;
      let errorMessage = 'Error al generar turno';
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        errorMessage = errorData.errors.map((e: any) => e.msg || e.message).join(', ');
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
      
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600" />
      </div>
    );
  }

  if (ticketGenerated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 p-8 flex items-center justify-center">
        <Card className="max-w-xl w-full p-12 bg-white text-center">
          <Ticket className="w-24 h-24 mx-auto text-green-600 mb-6" />
          <p className="text-2xl mb-4 text-gray-700">Tu turno es:</p>
          <div className="text-9xl font-bold text-blue-600 mb-6">{ticketGenerated}</div>
          <p className="text-xl text-gray-600 mb-2">
            Por favor espera tu turno en la sala
          </p>
          <p className="text-gray-500">
            {areas.find(a => a._id === selectedArea)?.name}
          </p>
          <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-yellow-800 text-sm">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Mantén tu ticket visible. Serás llamado en breve.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Ticket className="w-20 h-20 mx-auto text-white mb-4" />
          <h1 className="text-5xl font-bold text-white mb-2">Bienvenido</h1>
          <p className="text-2xl text-white">
            {config?.operationMode === 'single' 
              ? 'Obtén tu turno para ser atendido' 
              : 'Selecciona el servicio que necesitas'}
          </p>
        </div>

        {config?.requireCustomerValidation && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Información del Cliente</h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre"
                value={validationData.firstName}
                onChange={(e) => setValidationData({ ...validationData, firstName: e.target.value })}
                className="px-4 py-3 border rounded-lg text-lg"
              />
              <input
                type="text"
                placeholder="Apellido"
                value={validationData.lastName}
                onChange={(e) => setValidationData({ ...validationData, lastName: e.target.value })}
                className="px-4 py-3 border rounded-lg text-lg"
              />
              {config.validationType === 'dni' && (
                <input
                  type="text"
                  placeholder="DNI / Documento"
                  value={validationData.identificationNumber}
                  onChange={(e) => setValidationData({ ...validationData, identificationNumber: e.target.value })}
                  className="px-4 py-3 border rounded-lg text-lg col-span-2"
                />
              )}
              {config.validationType === 'phone' && (
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={validationData.phone}
                  onChange={(e) => setValidationData({ ...validationData, phone: e.target.value })}
                  className="px-4 py-3 border rounded-lg text-lg col-span-2"
                />
              )}
              {config.validationType === 'email' && (
                <input
                  type="email"
                  placeholder="Email"
                  value={validationData.email}
                  onChange={(e) => setValidationData({ ...validationData, email: e.target.value })}
                  className="px-4 py-3 border rounded-lg text-lg col-span-2"
                />
              )}
            </div>
          </Card>
        )}

        {config?.operationMode === 'multiple' && (
          <div className="grid gap-4 mb-8">
            {areas.map((area) => (
              <Card
                key={area._id}
                className={`p-8 cursor-pointer transition-all hover:scale-105 ${
                  selectedArea === area._id 
                    ? 'ring-4 ring-white bg-white' 
                    : 'bg-white/90 hover:bg-white'
                }`}
                onClick={() => setSelectedArea(area._id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600">{area.code}</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{area.name}</h2>
                    {area.description && (
                      <p className="text-gray-600 mt-1">{area.description}</p>
                    )}
                    {area.estimatedServiceTime && (
                      <p className="text-sm text-gray-500 mt-2">
                        Tiempo estimado: {area.estimatedServiceTime} minutos
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Button
          onClick={handleGenerateTicket}
          disabled={!selectedArea}
          className="w-full py-8 text-3xl font-bold shadow-xl"
        >
          <Ticket className="w-8 h-8 mr-3" />
          Obtener Turno
        </Button>

        {areas.length === 0 && (
          <Card className="p-8 bg-white/90 text-center">
            <p className="text-xl text-gray-600">
              No hay áreas de servicio disponibles en este momento
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
