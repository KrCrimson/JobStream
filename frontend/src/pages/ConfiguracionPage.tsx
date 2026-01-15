import React, { useEffect, useState } from 'react';
import { Card, Button } from '@/components/UI';
import { Save, RotateCcw } from 'lucide-react';
import { configService, SystemConfig } from '@/services/configService';
import toast from 'react-hot-toast';

export const ConfiguracionPage: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      console.log('Cargando configuración...');
      const data = await configService.get();
      console.log('Config recibida:', data);
      setConfig(data);
    } catch (error) {
      console.error('Error completo:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await configService.update(config);
      toast.success('Configuración guardada');
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Restaurar configuración por defecto?')) return;
    try {
      const data = await configService.reset();
      setConfig(data);
      toast.success('Configuración restaurada');
    } catch (error) {
      toast.error('Error al restaurar');
    }
  };

  if (loading || !config) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">⚙️ Configuración del Sistema</h1>
          <p className="text-gray-600 mt-1">Ajusta los parámetros del sistema de turnos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🎯 Modo de Operación</h2>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                checked={config.operationMode === 'single'}
                onChange={() => setConfig({ ...config, operationMode: 'single' })}
                className="w-5 h-5"
              />
              <div>
                <p className="font-semibold">Cola Única</p>
                <p className="text-sm text-gray-600">
                  Los clientes sacan un turno general sin elegir área específica
                </p>
              </div>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                checked={config.operationMode === 'multiple'}
                onChange={() => setConfig({ ...config, operationMode: 'multiple' })}
                className="w-5 h-5"
              />
              <div>
                <p className="font-semibold">Múltiples Colas</p>
                <p className="text-sm text-gray-600">
                  Los clientes eligen el área de servicio específica que necesitan
                </p>
              </div>
            </label>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🔐 Validación de Clientes</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.requireCustomerValidation}
              onChange={(e) => setConfig({ ...config, requireCustomerValidation: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="font-medium">Requerir validación de cliente al generar turno</span>
          </label>

          {config.requireCustomerValidation && (
            <div className="ml-8 space-y-2">
              <p className="text-sm text-gray-600 mb-2">Tipo de validación:</p>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={config.validationType === 'dni'}
                  onChange={() => setConfig({ ...config, validationType: 'dni' })}
                  className="w-4 h-4"
                />
                <span>DNI / Documento de Identidad</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={config.validationType === 'phone'}
                  onChange={() => setConfig({ ...config, validationType: 'phone' })}
                  className="w-4 h-4"
                />
                <span>Número de Teléfono</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={config.validationType === 'email'}
                  onChange={() => setConfig({ ...config, validationType: 'email' })}
                  className="w-4 h-4"
                />
                <span>Correo Electrónico</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={config.validationType === 'none'}
                  onChange={() => setConfig({ ...config, validationType: 'none' })}
                  className="w-4 h-4"
                />
                <span>Solo Nombre (sin validación específica)</span>
              </label>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🎫 Formato de Tickets</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prefijo del ticket</label>
            <input
              type="text"
              maxLength={5}
              value={config.ticketFormat.prefix}
              onChange={(e) => setConfig({
                ...config,
                ticketFormat: { ...config.ticketFormat, prefix: e.target.value.toUpperCase() }
              })}
              className="w-full max-w-xs px-3 py-2 border rounded-lg"
              placeholder="Ej: T, TICKET"
            />
            <p className="text-sm text-gray-500 mt-1">Aparecerá antes del número: {config.ticketFormat.prefix}-001</p>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.ticketFormat.useAreaCode}
              onChange={(e) => setConfig({
                ...config,
                ticketFormat: { ...config.ticketFormat, useAreaCode: e.target.checked }
              })}
              className="w-5 h-5"
            />
            <div>
              <p className="font-medium">Usar código de área en el ticket</p>
              <p className="text-sm text-gray-600">Ej: A-001, B-045 en lugar de T-001</p>
            </div>
          </label>

          <div>
            <label className="block text-sm font-medium mb-2">Longitud del número</label>
            <input
              type="number"
              min="2"
              max="6"
              value={config.ticketFormat.numberLength}
              onChange={(e) => setConfig({
                ...config,
                ticketFormat: { ...config.ticketFormat, numberLength: parseInt(e.target.value) }
              })}
              className="w-full max-w-xs px-3 py-2 border rounded-lg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Ejemplo: {config.ticketFormat.useAreaCode ? 'A' : config.ticketFormat.prefix}-
              {'0'.repeat(Math.max(0, config.ticketFormat.numberLength - 1))}1
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">📺 Configuración de Pantalla</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.displayConfig.showEstimatedWaitTime}
              onChange={(e) => setConfig({
                ...config,
                displayConfig: { ...config.displayConfig, showEstimatedWaitTime: e.target.checked }
              })}
              className="w-5 h-5"
            />
            <span className="font-medium">Mostrar tiempo estimado de espera</span>
          </label>

          <div>
            <label className="block text-sm font-medium mb-2">Intervalo de actualización (segundos)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={config.displayConfig.autoRefreshInterval}
              onChange={(e) => setConfig({
                ...config,
                displayConfig: { ...config.displayConfig, autoRefreshInterval: parseInt(e.target.value) }
              })}
              className="w-full max-w-xs px-3 py-2 border rounded-lg"
            />
            <p className="text-sm text-gray-500 mt-1">Frecuencia de actualización de la pantalla pública</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Recomendaciones</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Modo único: Ideal para bancos, oficinas gubernamentales con servicio general</li>
          <li>• Modo múltiple: Ideal para hospitales, centros comerciales con servicios variados</li>
          <li>• Validación DNI: Reduce duplicados y permite seguimiento personalizado</li>
          <li>• Actualización cada 3-5 segundos es óptimo para displays en tiempo real</li>
        </ul>
      </Card>
    </div>
  );
};
