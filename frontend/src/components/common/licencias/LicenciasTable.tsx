'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { LicenciaMedica, EstadoLicencia } from '@/types/licencia';
import { FILE_TYPE_CONFIG, STATUS_CONFIG, getFileExtension } from '@/types/licencia';
import { 
  Eye, 
  Download, 
  Trash2, 
  User, 
  MessageSquare, 
  Clock,
  Briefcase
} from 'lucide-react';

interface LicenciasTableProps {
  licencias: LicenciaMedica[];
  onView: (licencia: LicenciaMedica) => void;
  onDownload: (licencia: LicenciaMedica) => void;
  onDelete?: (licenciaId: string) => void; // Ahora es opcional
  showUserColumn?: boolean; // Nueva prop para identificar al funcionario
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
  onDelete,
  showUserColumn = false
}) => {
  if (licencias.length === 0) return (
    <div className="text-center p-10 bg-gray-50 rounded-xl border-2 border-dashed">
      <p className="text-gray-500 font-medium">No hay licencias registradas aún.</p>
    </div>
  );

  return (
    <Card className="overflow-hidden shadow-xl border-0">
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b-2 border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          📋 {showUserColumn ? 'Historial del Área' : 'Mis Licencias Médicas'}
          <span className="text-sm font-normal text-gray-600">
            ({licencias.length} {licencias.length === 1 ? 'registro' : 'registros'})
          </span>
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {showUserColumn && (
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Funcionario</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Folio / Archivo</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Período</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Observaciones</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Validado Por</th>
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
                <tr key={licencia.id} className="hover:bg-blue-50/40 transition-colors duration-150 group">
                  
                  {/* COLUMNA FUNCIONARIO (Condicional para Jefatura) */}
                  {showUserColumn && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-cyan-100 p-1.5 rounded-md text-cyan-600">
                          <User size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800 line-clamp-1">
                            {licencia.usuario_nombre}
                          </span>
                          <span className="text-[10px] text-gray-500 italic">
                            {licencia.area_nombre || 'Área Registrada'}
                          </span>
                        </div>
                      </div>
                    </td>
                  )}

                  {/* ARCHIVO */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${fileConfig.bgColor} flex items-center justify-center shadow-sm`}>
                        <span className="text-lg">{fileConfig.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate max-w-[120px]">
                          {licencia.numero_licencia}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">{ext}</p>
                      </div>
                    </div>
                  </td>

                  {/* PERIODO */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <div className="text-xs text-gray-600">
                        <span className="font-bold text-gray-900">{licencia.dias_totales} días</span>
                        <div className="flex flex-col text-[11px] text-gray-500">
                          <span>{formatDateSimple(licencia.fecha_inicio)}</span>
                          <span>{formatDateSimple(licencia.fecha_termino)}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* ESTADO */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.badge}`}>
                        {statusConfig.label.toUpperCase()}
                      </span>
                      {licencia.esta_vigente && licencia.estado === 'aprobada' && (
                        <span className="text-[9px] text-blue-600 font-black animate-pulse text-center">
                          ● EN CURSO
                        </span>
                      )}
                    </div>
                  </td>

                  {/* OBSERVACIONES */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2 max-w-[180px]">
                      <MessageSquare className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${licencia.comentarios_revision ? 'text-amber-500' : 'text-gray-300'}`} />
                      <p className={`text-[11px] leading-tight line-clamp-2 ${licencia.comentarios_revision ? 'text-gray-700 italic' : 'text-gray-400'}`}>
                        {licencia.comentarios_revision || 'Sin observaciones'}
                      </p>
                    </div>
                  </td>

                  {/* VALIDADO POR */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                        {licencia.revisada_por_nombre ? licencia.revisada_por_nombre.charAt(0) : <Clock className="w-3 h-3 text-gray-400" />}
                      </div>
                      <span className="text-[11px] font-medium text-gray-700 truncate max-w-[100px]">
                        {licencia.revisada_por_nombre || 'Pendiente'}
                      </span>
                    </div>
                  </td>

                  {/* FECHA CARGA */}
                  <td className="px-6 py-4">
                    <p className="text-[11px] text-gray-500">{formatDate(licencia.creado_en)}</p>
                  </td>

                  {/* ACCIONES */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onView(licencia)}
                        className="h-8 px-2 text-[#009DDC] hover:bg-blue-50 gap-1.5 text-[10px] font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        VER
                      </Button>
                      
                      <div className="h-4 w-[1px] bg-gray-200 mx-1" />

                      <button 
                        onClick={() => onDownload(licencia)} 
                        title="Ver Documento"
                        className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      {/* ELIMINAR: Solo si se pasa la función onDelete y no está aprobada */}
                      {onDelete && licencia.estado !== 'aprobada' && (
                        <button 
                          onClick={() => onDelete(licencia.id)} 
                          title="Eliminar registro"
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
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