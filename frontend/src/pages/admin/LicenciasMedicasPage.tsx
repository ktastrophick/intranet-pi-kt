'use client';

import React, { useState, useEffect } from 'react';
import { FileUploader } from '@/components/common/licencias/FileUploader';
import { LicenciasTable } from '@/components/common/licencias/LicenciasTable';
import { LicenciaUploadModal, type LicenciaFormData } from '@/components/common/licencias/LicenciaUploadModal';
// IMPORTAMOS EL NUEVO MODAL DE DETALLES
import { LicenciaDetailsModal } from '@/components/common/licencias/LicenciaDetailsModal';
import type { LicenciaMedica } from '@/types/licencia';
import { FileText, Loader2 } from 'lucide-react';
import { UnifiedNavbar } from '@/components/common/layout/UnifiedNavbar';
import Footer from '@/components/common/layout/Footer';
import { useAuth } from '@/api/contexts/AuthContext';
import BannerLicencias from '@/components/images/banners_finales/BannerLicencias';
import api from '@/api/axios'; 
import { toast } from 'sonner';

export const LicenciasMedicasPage: React.FC = () => {
  const { user } = useAuth();
  
  const [licencias, setLicencias] = useState<LicenciaMedica[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ESTADOS PARA MODALES
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLicencia, setSelectedLicencia] = useState<LicenciaMedica | null>(null);

  // 1. CARGA DE DATOS
  useEffect(() => {
    const cargarLicencias = async () => {
      try {
        setLoading(true);
        const response = await api.get('/licencias/'); 
        setLicencias(response.data);
      } catch (error) {
        console.error("Error cargando licencias:", error);
        toast.error("No se pudieron cargar las licencias");
      } finally {
        setLoading(false);
      }
    };

    cargarLicencias();
  }, []);

  // 2. SUBIDA DE LICENCIA
  const handleSubmitLicencia = async (data: LicenciaFormData) => {
    if (!data.archivo) return;

    const formData = new FormData();
    formData.append('numero_licencia', data.numero_licencia);
    formData.append('fecha_inicio', data.fechaInicio);
    formData.append('fecha_termino', data.fechaTermino);
    formData.append('documento_licencia', data.archivo);

    try {
      const response = await api.post('/licencias/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setLicencias([response.data, ...licencias]);
      setIsUploadModalOpen(false);
      toast.success("Licencia cargada exitosamente");
    } catch (error) {
      console.error("Error al subir licencia:", error);
      toast.error("Error al subir el archivo al servidor");
    }
  };

  // 3. ELIMINACIÓN
  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta licencia permanentemente?")) return;
    try {
      await api.delete(`/licencias/${id}/`);
      setLicencias(licencias.filter(l => l.id !== id));
      toast.success("Eliminado correctamente");
    } catch (error) {
      toast.error("No se pudo eliminar");
    }
  };

  // 4. MANEJO DE VISTA DE DETALLES (Abre el Modal)
  const handleViewDetails = (licencia: LicenciaMedica) => {
    setSelectedLicencia(licencia);
    setIsDetailsModalOpen(true);
  };

  const handleDownload = (licencia: LicenciaMedica) => {
     const link = document.createElement('a');
     link.href = licencia.documento_licencia;
     link.download = `licencia_${licencia.numero_licencia}.pdf`;
     link.click();
  };

  // ESTADÍSTICAS
  const stats = {
    total: licencias.length,
    aprobadas: licencias.filter(l => l.estado === 'aprobada').length,
    pendientes: licencias.filter(l => l.estado === 'pendiente').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedNavbar />
      <div className="h-16" />
      <BannerLicencias />

      <main className="flex-1 bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          
          {/* Header con Stats */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-gray-800">Mis Licencias Médicas</h1>
                <p className="text-sm text-gray-600">Gestión de documentos personales y seguimiento</p>
              </div>
              <div className="bg-gradient-to-r from-[#009DDC] to-[#4DFFF3] text-white px-4 py-2 rounded-lg shadow-sm">
                <p className="text-xs font-semibold">👤 Funcionario: {user?.nombre}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500">
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Historial Total</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border-l-4 border-green-500">
                <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Validadas</p>
                <p className="text-2xl font-bold text-gray-800">{stats.aprobadas}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-500">
                <p className="text-xs text-yellow-600 font-bold uppercase tracking-wider">En Revisión</p>
                <p className="text-2xl font-bold text-gray-800">{stats.pendientes}</p>
              </div>
            </div>
          </div>

          {/* Subidor de archivos */}
          <FileUploader onOpenModal={() => setIsUploadModalOpen(true)} />

          {/* Modal para subir nueva licencia */}
          <LicenciaUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onSubmit={handleSubmitLicencia}
          />

          {/* NUEVO: Modal para ver detalles completos de una licencia */}
          <LicenciaDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            licencia={selectedLicencia}
          />

          {/* Cuerpo de la tabla */}
          {loading ? (
            <div className="flex flex-col items-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-[#009DDC] mb-4" />
              <p className="text-gray-500 font-medium tracking-tight">Cargando registros...</p>
            </div>
          ) : (
            <>
              <LicenciasTable
                licencias={licencias}
                onView={handleViewDetails} // Ahora abre el modal de detalles
                onDownload={handleDownload}
                onDelete={handleDelete}
              />

              {licencias.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-300 mt-6">
                  <FileText className="w-12 h-12 text-gray-300 mb-3" />
                  <h3 className="text-lg font-bold text-gray-700">Aún no tienes licencias registradas</h3>
                  <p className="text-gray-500 text-sm">Usa el botón superior para subir tu primer documento.</p>
                </div>
              )}
            </>
          )}
          
        </div>
      </main>
      <Footer />
    </div>
  );
};