import React, { useEffect, useState } from 'react';
import { Card, Button } from '@/components/UI';
import { Plus, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { trabajadorService, Trabajador, CreateTrabajadorData } from '@/services/trabajadorService';
import { areaService, Area } from '@/services/areaService';
import toast from 'react-hot-toast';

export const TrabajadoresPage: React.FC = () => {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateTrabajadorData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    serviceAreas: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Cargando trabajadores y áreas...');
      const [trabajadoresData, areasData] = await Promise.all([
        trabajadorService.getAll(),
        areaService.getAll(),
      ]);
      console.log('Trabajadores:', trabajadoresData);
      console.log('Áreas:', areasData);
      setTrabajadores(trabajadoresData);
      setAreas(areasData);
    } catch (error) {
      console.error('Error completo:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Limpiar duplicados y normalizar a mayúsculas antes de enviar
      const cleanedData = {
        ...formData,
        serviceAreas: [...new Set((formData.serviceAreas || []).map(code => code.toUpperCase()))]
      };
      console.log('📤 Enviando datos al backend:', cleanedData);
      console.log('📋 ServiceAreas enviadas:', cleanedData.serviceAreas);
      if (editingId) {
        await trabajadorService.update(editingId, cleanedData);
        toast.success('Trabajador actualizado');
      } else {
        const result = await trabajadorService.create(cleanedData);
        console.log('✅ Respuesta del backend:', result);
        toast.success('Trabajador creado');
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('❌ Error response:', (error as any)?.response);
      toast.error('Error al guardar trabajador');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este trabajador?')) return;
    try {
      await trabajadorService.delete(id);
      toast.success('Trabajador eliminado');
      loadData();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleEdit = (trabajador: Trabajador) => {
    setEditingId(trabajador._id);
    // Convertir IDs de MongoDB a códigos si es necesario
    const areaCodes = (trabajador.serviceAreas || []).map(areaIdOrCode => {
      // Si es un ID de MongoDB (24 caracteres hex), buscar el código correspondiente
      if (areaIdOrCode.length === 24 && /^[a-f0-9]{24}$/i.test(areaIdOrCode)) {
        const area = areas.find(a => a._id === areaIdOrCode);
        return area ? area.code : areaIdOrCode;
      }
      // Si ya es un código, devolverlo en mayúsculas
      return areaIdOrCode.toUpperCase();
    });
    const uniqueAreas = [...new Set(areaCodes)];
    setFormData({
      firstName: trabajador.firstName,
      lastName: trabajador.lastName,
      email: trabajador.email,
      password: '',
      serviceAreas: uniqueAreas,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      serviceAreas: [],
    });
    setEditingId(null);
  };

  const toggleArea = (areaCode: string) => {
    const normalizedCode = areaCode.toUpperCase();
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas?.includes(normalizedCode)
        ? prev.serviceAreas.filter(code => code !== normalizedCode)
        : [...(prev.serviceAreas || []), normalizedCode],
    }));
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">👥 Gestión de Trabajadores</h1>
          <p className="text-gray-600 mt-1">Administra empleados y asigna áreas de servicio</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Trabajador
        </Button>
      </div>

      <div className="grid gap-4">
        {trabajadores.map((trabajador) => (
          <Card key={trabajador._id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">
                    {trabajador.firstName} {trabajador.lastName}
                  </h3>
                  {trabajador.isActive ? (
                    <UserCheck className="w-5 h-5 text-green-600" />
                  ) : (
                    <UserX className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <p className="text-gray-600">{trabajador.email}</p>
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Áreas asignadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {trabajador.serviceAreas.length > 0 ? (
                      trabajador.serviceAreas.map((areaIdOrCode) => {
                        // Intentar encontrar por código primero, luego por ID
                        const area = areas.find(a => a.code === areaIdOrCode || a._id === areaIdOrCode);
                        return area ? (
                          <span key={areaIdOrCode} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {area.name}
                          </span>
                        ) : (
                          <span key={areaIdOrCode} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                            {areaIdOrCode}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-gray-400 text-sm">Sin áreas asignadas</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleEdit(trabajador)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleDelete(trabajador._id)}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingId ? 'Editar Trabajador' : 'Nuevo Trabajador'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Contraseña {editingId && '(dejar vacío para mantener)'}
                </label>
                <input
                  type="password"
                  required={!editingId}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Áreas de servicio</label>
                <div className="grid grid-cols-2 gap-2">
                  {areas.map((area) => (
                    <label key={area._id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.serviceAreas?.includes(area.code)}
                        onChange={() => toggleArea(area.code)}
                        className="w-4 h-4"
                      />
                      <span>{area.name} ({area.code})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
