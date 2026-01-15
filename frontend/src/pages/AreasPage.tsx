import React, { useEffect, useState } from 'react';
import { Card, Button } from '@/components/UI';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { areaService, Area, CreateAreaData } from '@/services/areaService';
import toast from 'react-hot-toast';

export const AreasPage: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateAreaData>({
    name: '',
    code: '',
    description: '',
    maxWaitingCustomers: undefined,
    estimatedServiceTime: undefined,
  });

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      console.log('Cargando áreas...');
      const data = await areaService.getAll();
      console.log('Áreas recibidas:', data);
      setAreas(data);
    } catch (error) {
      console.error('Error completo:', error);
      toast.error('Error al cargar áreas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await areaService.update(editingId, formData);
        toast.success('Área actualizada');
      } else {
        await areaService.create(formData);
        toast.success('Área creada');
      }
      setShowModal(false);
      resetForm();
      loadAreas();
    } catch (error) {
      toast.error('Error al guardar área');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta área?')) return;
    try {
      await areaService.delete(id);
      toast.success('Área eliminada');
      loadAreas();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleEdit = (area: Area) => {
    setEditingId(area._id);
    setFormData({
      name: area.name,
      code: area.code,
      description: area.description || '',
      maxWaitingCustomers: area.maxWaitingCustomers,
      estimatedServiceTime: area.estimatedServiceTime,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      maxWaitingCustomers: undefined,
      estimatedServiceTime: undefined,
    });
    setEditingId(null);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏢 Áreas de Servicio</h1>
          <p className="text-gray-600 mt-1">Configura las áreas o colas de atención</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Área
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {areas.map((area) => (
          <Card key={area._id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">{area.code}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{area.name}</h3>
                  <p className="text-sm text-gray-500">Código: {area.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {area.isActive ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            
            {area.description && (
              <p className="text-gray-600 mb-4">{area.description}</p>
            )}
            
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              {area.maxWaitingCustomers && (
                <div>
                  <p className="text-gray-500">Máx. en espera</p>
                  <p className="font-semibold">{area.maxWaitingCustomers}</p>
                </div>
              )}
              {area.estimatedServiceTime && (
                <div>
                  <p className="text-gray-500">Tiempo estimado</p>
                  <p className="font-semibold">{area.estimatedServiceTime} min</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(area)} className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(area._id)}>
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {areas.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500">No hay áreas configuradas. Crea la primera.</p>
        </Card>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingId ? 'Editar Área' : 'Nueva Área'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del Área</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ej: Atención General"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Código (1-2 letras)</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ej: A, B, VIP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Describe el tipo de servicio..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Máx. en espera</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxWaitingCustomers || ''}
                    onChange={(e) => setFormData({ ...formData, maxWaitingCustomers: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Sin límite"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tiempo est. (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.estimatedServiceTime || ''}
                    onChange={(e) => setFormData({ ...formData, estimatedServiceTime: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="15"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
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
