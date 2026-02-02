'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import type { LicenciaMedica, EstadoLicencia } from '@/types/licencia';
import { FILE_TYPE_CONFIG, STATUS_CONFIG, getFileExtension } from '@/types/licencia';
import { Eye, Download, Trash2, Calendar, User, MessageSquare, ShieldCheck } from 'lucide-react';

interface LicenciasTableProps {
  licencias: LicenciaMedica[];
  onView: (licencia: LicenciaMedica) => void;
  onDownload: (licencia: LicenciaMedica) => void;
  onDelete: (licenciaId: string) => void;
}

// Helpers locales para formateo
const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateSimple = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const LicenciasTable: React.FC<LicenciasTableProps> = ({
  licencias,
  onView,
  onDownload,
  onDelete
}) => {
  if (licencias.length === 0) return (
    <div className="text-center p-10 bg-gray-50 rounded-xl border-2 border-dashed">
      <p className="text-gray-500">No hay licencias registradas aún.</p>
    </div>
  );

  return (
    <Card className="overflow-hidden shadow-xl border-0">
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b-2 border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          📋 Historial de Licencias Médicas
          <span className="text-sm font-normal text-gray-600">
            ({licencias.length} {licencias.length === 1 ? 'registro' : 'registros'})
          </span>
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Folio / Archivo</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Funcionario</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Período</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado y Observaciones</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Fecha Carga</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {licencias.map((licencia) => {
              const ext = getFileExtension(licencia.documento_licencia);
              const fileConfig = FILE_TYPE_CONFIG[ext] || FILE_TYPE_CONFIG.default;

              const estadoActual = licencia.estado as EstadoLicencia;
              const statusConfig = STATUS_CONFIG[estadoActual] || {
                label: licencia.estado || 'Desconocido',
                badge: 'bg-gray-100 text-gray-600 border-gray-200'
              };

              return (
                <tr key={licencia.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                  {/* ARCHIVO */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${fileConfig.bgColor} flex items-center justify-center shadow-sm`}>
                        <span className="text-xl">{fileConfig.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]">
                          Folio: {licencia.numero_licencia}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">{ext}</p>
                      </div>
                    </div>
                  </td>

                  {/* FUNCIONARIO */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{licencia.usuario_nombre || 'No asignado'}</p>
                        <p className="text-xs text-gray-500">{licencia.area_nombre || 'Sin área'}</p>
                      </div>
                    </div>
                  </td>

                  {/* PERIODO */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <div className="text-xs text-gray-600">
                        <span className="font-bold text-gray-900">{licencia.dias_totales} días</span>
                        <div className="flex flex-col text-gray-500 mt-0.5">
                          <span>Desde: {formatDateSimple(licencia.fecha_inicio)}</span>
                          <span>Hasta: {formatDateSimple(licencia.fecha_termino)}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* ESTADO Y OBSERVACIONES EDITADO */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2 max-w-[250px]">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.badge}`}>
                          {statusConfig.label.toUpperCase()}
                        </span>
                        {licencia.esta_vigente && licencia.estado === 'aprobada' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                            EN CURSO
                          </span>
                        )}
                      </div>

                      {/* Mensaje de error/rechazo para el funcionario */}
                      {licencia.estado === 'rechazada' && licencia.comentarios_revision && (
                        <div className="flex items-start gap-1.5 p-2 bg-red-50 border border-red-100 rounded-lg">
                          <MessageSquare className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-red-700 leading-tight">
                            <span className="font-bold">Corrección:</span> {licencia.comentarios_revision}
                          </p>
                        </div>
                      )}

                      {/* Información de quién aprobó */}
                      {licencia.estado === 'aprobada' && licencia.revisada_por_nombre && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Validado por: {licencia.revisada_por_nombre}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* FECHA CARGA */}
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-500">{formatDate(licencia.creado_en)}</p>
                  </td>

                  {/* ACCIONES */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => onView(licencia)} 
                        title="Ver detalles"
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDownload(licencia)} 
                        title="Descargar"
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      {/* Solo se permite eliminar si está pendiente o rechazada (para corregir) */}
                      {licencia.estado !== 'aprobada' && (
                        <button 
                          onClick={() => onDelete(licencia.id)} 
                          title="Eliminar para re-subir"
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default LicenciasTable;