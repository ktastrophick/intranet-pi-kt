'use client';

import React, { useState, useEffect } from 'react';
import { FileUploader } from '@/components/common/licencias/FileUploader';
import { LicenciasTable } from '@/components/common/licencias/LicenciasTable';
import { LicenciaUploadModal, type LicenciaFormData } from '@/components/common/licencias/LicenciaUploadModal';
import { LicenciaDetailsModal } from '@/components/common/licencias/LicenciaDetailsModal';
import type { LicenciaMedica } from '@/types/licencia';
import { FileText, Loader2, User, Users, History } from 'lucide-react';
import { UnifiedNavbar } from '@/components/common/layout/UnifiedNavbar';
import Footer from '@/components/common/layout/Footer';
import { useAuth } from '@/api/contexts/AuthContext';
import { usePermissions } from '@/hooks/userPermissions'; // Importamos el hook de permisos
import BannerLicencias from '@/components/images/banners_finales/BannerLicencias';
import api from '@/api/axios'; 
import { toast } from 'sonner';

type TabType = 'mis-licencias' | 'mi-area';

export const LicenciasMedicasPage: React.FC = () => {
  const { user } = useAuth();
  const { esJefatura } = usePermissions(); // Detectamos si es jefe
  
  const [activeTab, setActiveTab] = useState<TabType>('mis-licencias');
  const [misLicencias, setMisLicencias] = useState<LicenciaMedica[]>([]);
  const [licenciasArea, setLicenciasArea] = useState<LicenciaMedica[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ESTADOS PARA MODALES
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLicencia, setSelectedLicencia] = useState<LicenciaMedica | null>(null);

  // 1. CARGA DE DATOS
  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargamos las licencias personales (siempre)
      const resMisLicencias = await api.get('/licencias/mis_licencias/');
      setMisLicencias(resMisLicencias.data);

      // Si es jefatura, cargamos el historial del área
      if (esJefatura) {
        const resArea = await api.get('/licencias/historial_area/');
        setLicenciasArea(resArea.data);
      }
    } catch (error) {
      console.error("Error cargando licencias:", error);
      toast.error("No se pudo sincronizar la información");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [esJefatura]);

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
      setMisLicencias([response.data, ...misLicencias]);
      setIsUploadModalOpen(false);
      toast.success("Licencia cargada exitosamente");
    } catch (error) {
      toast.error("Error al subir el archivo");
    }
  };

  // 3. ELIMINACIÓN
  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta licencia permanentemente?")) return;
    try {
      await api.delete(`/licencias/${id}/`);
      setMisLicencias(misLicencias.filter(l => l.id !== id));
      toast.success("Eliminado correctamente");
    } catch (error) {
      toast.error("No se pudo eliminar");
    }
  };

  const handleViewDetails = (licencia: LicenciaMedica) => {
    setSelectedLicencia(licencia);
    setIsDetailsModalOpen(true);
  };

  const handleDownload = (licencia: LicenciaMedica) => {
     window.open(licencia.documento_licencia, '_blank');
  };

  // ESTADÍSTICAS (Basadas en la pestaña activa o generales)
  const stats = {
    total: misLicencias.length,
    aprobadas: misLicencias.filter(l => l.estado === 'aprobada').length,
    pendientes: misLicencias.filter(l => l.estado === 'pendiente').length
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <UnifiedNavbar />
      <div className="h-16" />
      <BannerLicencias />

      <main className="flex-1 bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          
          {/* Header con Perfil y Stats */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl font-bold text-gray-800">Panel de Licencias Médicas</h1>
                <p className="text-sm text-gray-600">Gestión de documentos y seguimiento de estado</p>
              </div>
              
              {/* Selector de Pestañas para Jefatura */}
              {esJefatura && (
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit self-start md:self-center">
                  <button
                    onClick={() => setActiveTab('mis-licencias')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      activeTab === 'mis-licencias' 
                      ? "bg-white text-[#009DDC] shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <User size={16} /> Mis Licencias
                  </button>
                  <button
                    onClick={() => setActiveTab('mi-area')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      activeTab === 'mi-area' 
                      ? "bg-white text-[#009DDC] shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Users size={16} /> Licencias de mi Área
                  </button>
                </div>
              )}
            </div>

            {/* Stats - Solo visibles en Mis Licencias */}
            {activeTab === 'mis-licencias' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
                  <div className="bg-blue-500 p-2 rounded-lg text-white"><History size={20}/></div>
                  <div>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Historial Personal</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                  </div>
                </div>
                <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex items-center gap-4">
                  <div className="bg-green-500 p-2 rounded-lg text-white"><FileText size={20}/></div>
                  <div>
                    <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Aprobadas</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.aprobadas}</p>
                  </div>
                </div>
                <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 flex items-center gap-4">
                  <div className="bg-yellow-500 p-2 rounded-lg text-white"><Loader2 size={20}/></div>
                  <div>
                    <p className="text-[10px] text-yellow-600 font-bold uppercase tracking-wider">En Revisión</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.pendientes}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mi-area' && (
              <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-xl">
                <p className="text-cyan-800 text-sm flex items-center gap-2">
                  <Users size={18} /> 
                  Viendo historial de licencias <strong>aprobadas</strong> de funcionarios pertenecientes a su área.
                </p>
              </div>
            )}
          </div>

          {/* Acciones de carga solo para licencias personales */}
          {activeTab === 'mis-licencias' && (
            <FileUploader onOpenModal={() => setIsUploadModalOpen(true)} />
          )}

          {/* Contenido Principal */}
          {loading ? (
            <div className="flex flex-col items-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-[#009DDC] mb-4" />
              <p className="text-gray-500 font-medium">Sincronizando con el servidor...</p>
            </div>
          ) : (
            <div className="mt-6">
              <LicenciasTable
                licencias={activeTab === 'mis-licencias' ? misLicencias : licenciasArea}
                onView={handleViewDetails}
                onDownload={handleDownload}
                onDelete={activeTab === 'mis-licencias' ? handleDelete : undefined}
                // Si estamos en la pestaña de área, mostramos el nombre del funcionario
                showUserColumn={activeTab === 'mi-area'} 
              />

              {(activeTab === 'mis-licencias' ? misLicencias : licenciasArea).length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 bg-white/50 rounded-3xl border border-dashed border-gray-300">
                  <FileText className="w-12 h-12 text-gray-300 mb-3" />
                  <h3 className="text-lg font-bold text-gray-700">No se encontraron registros</h3>
                  <p className="text-gray-500 text-sm">
                    {activeTab === 'mis-licencias' 
                      ? "Aún no has subido ninguna licencia médica." 
                      : "No hay licencias aprobadas en tu área actualmente."}
                  </p>
                </div>
              )}
            </div>
          )}
          
        </div>
      </main>

      {/* Modales */}
      <LicenciaUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={handleSubmitLicencia}
      />

      <LicenciaDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        licencia={selectedLicencia}
      />

      <Footer />
    </div>
  );
};