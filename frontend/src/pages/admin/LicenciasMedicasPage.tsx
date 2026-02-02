'use client';

import React, { useState, useEffect } from 'react';
import { FileUploader } from '@/components/common/licencias/FileUploader';
import { LicenciasTable } from '@/components/common/licencias/LicenciasTable';
import { LicenciaUploadModal, type LicenciaFormData } from '@/components/common/licencias/LicenciaUploadModal';
import type { LicenciaMedica } from '@/types/licencia';
import { FileText, Loader2 } from 'lucide-react';
import { UnifiedNavbar } from '@/components/common/layout/UnifiedNavbar';
import Footer from '@/components/common/layout/Footer';
import { useAuth } from '@/api/contexts/AuthContext';
import BannerLicencias from '@/components/images/banners_finales/BannerLicencias';

// --- IMPORTANTE: Aquí debes importar tu instancia de API (axios) ---
import api from '@/api/axios'; 
import { toast } from 'sonner'; // O la librería de alertas que uses

export const LicenciasMedicasPage: React.FC = () => {
  const { user } = useAuth();
  
  // 1. Iniciamos con la lista vacía (sin mock)
  const [licencias, setLicencias] = useState<LicenciaMedica[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true); // Estado de carga

  // 2. EFECTO PARA CARGAR DATOS REALES DEL BACKEND
  useEffect(() => {
    const cargarLicencias = async () => {
      try {
        setLoading(true);
        // Ajusta la URL según tu backend de Django
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

  // 3. ENVIAR LICENCIA REAL AL BACKEND
  const handleSubmitLicencia = async (data: LicenciaFormData) => {
    if (!data.archivo) return;

    // Para enviar archivos a Django necesitamos FormData
    const formData = new FormData();
    formData.append('numero_licencia', (data as any).numero_licencia);
    formData.append('fecha_inicio', data.fechaInicio);
    formData.append('fecha_termino', data.fechaTermino);
    formData.append('documento_licencia', data.archivo); // El archivo real
    formData.append('usuario', user?.id || ''); // ID del funcionario

    try {
      const response = await api.post('/licencias/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Si el backend responde OK, agregamos la respuesta real al estado
      setLicencias([response.data, ...licencias]);
      setIsModalOpen(false);
      toast.success("Licencia cargada exitosamente");
    } catch (error) {
      console.error("Error al subir licencia:", error);
      toast.error("Error al subir el archivo al servidor");
    }
  };

  // 4. ELIMINAR REAL
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

  const handleView = (licencia: LicenciaMedica) => window.open(licencia.documento_licencia, '_blank');
  const handleDownload = (licencia: LicenciaMedica) => {
     const link = document.createElement('a');
     link.href = licencia.documento_licencia;
     link.download = `licencia_${licencia.numero_licencia}.pdf`;
     link.click();
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  // ESTADÍSTICAS (se calculan sobre los datos reales que llegan del backend)
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
                <h1 className="text-xl font-bold">Gestión de Licencias</h1>
                <p className="text-sm text-gray-600">Repositorio digital administrativo</p>
              </div>
              <div className="bg-gradient-to-r from-[#009DDC] to-[#4DFFF3] text-white px-4 py-2 rounded-lg">
                <p className="text-xs font-semibold">🔒 Acceso Administrativo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Stat Total */}
              <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              {/* Stat Aprobadas */}
              <div className="bg-green-50 p-4 rounded-xl border-l-4 border-green-500">
                <p className="text-sm text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold">{stats.aprobadas}</p>
              </div>
              {/* Stat Pendientes */}
              <div className="bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-500">
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold">{stats.pendientes}</p>
              </div>
            </div>
          </div>

          <FileUploader onOpenModal={handleOpenModal} />

          <LicenciaUploadModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleSubmitLicencia}
          />

          {/* Si está cargando, mostramos un spinner */}
          {loading ? (
            <div className="flex flex-col items-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-500">Conectando con el servidor...</p>
            </div>
          ) : (
            <>
              <LicenciasTable
                licencias={licencias}
                onView={handleView}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />

              {licencias.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-bold text-gray-800">No hay datos en la base de datos</h3>
                  <p className="text-gray-500">Sube el primer archivo para comenzar.</p>
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