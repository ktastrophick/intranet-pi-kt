// ======================================================
// PÁGINA PRINCIPAL: Gestión de Licencias Médicas
// Ubicación: src/pages/LicenciasMedicas.tsx
// Descripción: Sistema de gestión de licencias médicas digitalizadas
// ======================================================

'use client';

import React, { useState, useEffect } from 'react';
import { FileUploader } from '@/components/common/licencias/FileUploader';
import { LicenciasTable } from '@/components/common/licencias/LicenciasTable';
import { LicenciaUploadModal, type LicenciaFormData } from '@/components/common/licencias/LicenciaUploadModal';
import type { LicenciaMedica } from '@/types/licencia';
// Eliminamos calcularEstadoLicencia si ahora el estado viene del backend (pendiente/aprobada)
import { FileText, TrendingUp, Clock } from 'lucide-react';
import { UnifiedNavbar } from '@/components/common/layout/UnifiedNavbar';
import Footer from '@/components/common/layout/Footer';
import { useAuth } from '@/api/contexts/AuthContext';
import BannerLicencias from '@/components/images/banners_finales/BannerLicencias';


import { mockLicencias } from '@/data/mockLicencias';

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export const LicenciasMedicasPage: React.FC = () => {
  // ======================================================
  // ESTADOS
  // ======================================================

  const { user } = useAuth();
  const [licencias, setLicencias] = useState<LicenciaMedica[]>(mockLicencias);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ======================================================
  // EFECTOS
  // ======================================================

  useEffect(() => {

  }, []);

  // ======================================================
  // FUNCIONES
  // ======================================================



  // ======================================================
  // MANEJADORES DE EVENTOS
  // ======================================================

  /**
   * Maneja la apertura del modal
   */
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  /**
   * Maneja el cierre del modal
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  /**
   * Maneja el envío del formulario de licencia
   */
  const handleSubmitLicencia = (data: LicenciaFormData) => {
    if (!data.archivo) return;

    
    const nuevaLicencia: any = {
      id: crypto.randomUUID(),
      numero_licencia: "PENDIENTE", // El folio real lo dará el backend
      usuario_nombre: user?.nombre_completo || 'Mi Licencia',
      fecha_inicio: data.fechaInicio,
      fecha_termino: data.fechaTermino,
      dias_totales: calcularDiasLicencia(data.fechaInicio, data.fechaTermino),
      estado: 'pendiente', // Toda licencia nueva entra como pendiente
      documento_licencia: URL.createObjectURL(data.archivo),
      creado_en: new Date().toISOString()
    };

    setLicencias([nuevaLicencia, ...licencias]);
    console.log('Nueva licencia registrada:', nuevaLicencia);

    // TODO: Aquí se haría la llamada al backend para guardar la licencia
    /*
    try {
      await licenciaService.create({
        usuario: data.empleadoId,
        fecha_inicio: data.fechaInicio,
        fecha_termino: data.fechaTermino,
        archivo: data.archivo
      });
    } catch (error) {
      console.error('Error al guardar licencia:', error);
    }
    */
  };

  /**
   * Calcular días de licencia
   */
  const calcularDiasLicencia = (inicio: string, termino: string): number => {
    const dInicio = new Date(inicio);
    const dTermino = new Date(termino);
    const dif = dTermino.getTime() - dInicio.getTime();
    return Math.ceil(dif / (1000 * 60 * 60 * 24)) + 1;
  };

  /**
   * Ver archivo (abrir en modal o nueva pestaña)
   */
  const handleView = (licencia: any) => window.open(licencia.documento_licencia, '_blank');
  const handleDownload = (licencia: any) => {
     const link = document.createElement('a');
     link.href = licencia.documento_licencia;
     link.download = `licencia_${licencia.numero_licencia}.pdf`;
     link.click();
  };
  const handleDelete = (id: string) => setLicencias(licencias.filter(l => l.id !== id));

  // ======================================================
  // ESTADÍSTICAS
  // ======================================================

  const stats = {
    total: licencias.length,
    aprobadas: licencias.filter(l => l.estado === 'aprobada').length,
    pendientes: licencias.filter(l => l.estado === 'pendiente').length
  };
  // ======================================================
  // RENDERIZADO
  // ======================================================

  // ======================================================
  // RENDERIZADO
  // ======================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedNavbar />
      <div className="h-16" />
      <BannerLicencias></BannerLicencias>

      {/* CORRECCIÓN 1: Cambiado de <div> a <main> para coincidir con la estructura semántica */}
      <main className="flex-1 bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Header Container */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            {/* Título principal */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                
                <div>
                  
                  <p className="text-sm text-gray-600">
                    Repositorio digital de licencias del personal
                  </p>
                </div>
              </div>

              {/* Badge de acceso */}
              <div className="bg-gradient-to-r from-[#009DDC] to-[#4DFFF3] text-white px-4 py-2 rounded-lg">
                <p className="text-xs font-semibold">🔒 Acceso Administrativo</p>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Total de licencias */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-l-4 border-blue-500">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Total Licencias
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total}
                    </p>
                  </div>
                </div>
              </div>

              {/* Licencias aprobadas (antes decía vigentes) */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-l-4 border-green-500">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                      <p className="text-sm text-gray-600 font-medium">Aprobadas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.aprobadas} {/* ANTES: stats.vigentes */}
                      </p>
                    </div>
                  </div>
                </div>

              {/* Licencias pendientes (antes decía vencidas) */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border-l-4 border-yellow-500">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Pendientes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.pendientes} {/* ANTES: stats.vencidas */}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nota informativa */}
          <div className="bg-blue-50 border-l-4 border-[#009DDC] rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-[#009DDC] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">Información importante:</p>
                <p>
                  Este módulo está diseñado exclusivamente para <strong>Dirección y Subdirecciones</strong>. 
                  Todos los archivos subidos se almacenan de forma segura y solo son accesibles 
                  para personal administrativo autorizado.
                </p>
              </div>
            </div>
          </div>

          {/* FIX: FileUploader ya no recibe hasFiles */}
          <FileUploader onOpenModal={handleOpenModal} />

          {/* FIX: LicenciaUploadModal ya no recibe empleados */}
          <LicenciaUploadModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleSubmitLicencia}
          />

          <LicenciasTable
            licencias={licencias}
            onView={handleView}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />

          {/* Estado vacío cuando no hay licencias */}
          {licencias.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-32 h-32 mb-6 rounded-full bg-gradient-to-br from-blue-100 to-gray-100 flex items-center justify-center">
                <FileText className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                No hay licencias cargadas
              </h3>
              <p className="text-gray-600 text-center max-w-md">
                Comienza subiendo las licencias médicas digitalizadas del personal 
                utilizando el área de carga superior.
              </p>
            </div>
          )}
          
        {/* CORRECCIÓN 2: Cierre correcto de divs anidados */}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};
// ======================================================
// EXPORT
// ======================================================