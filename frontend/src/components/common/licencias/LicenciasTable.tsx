'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import type { LicenciaMedica } from '@/types/licencia';
import { FILE_TYPE_CONFIG, STATUS_CONFIG, getFileExtension } from '@/types/licencia';
import { Eye, Download, Trash2, Calendar, User, Briefcase, FileText } from 'lucide-react';

interface LicenciasTableProps {
  licencias: LicenciaMedica[];
  onView: (licencia: LicenciaMedica) => void;
  onDownload: (licencia: LicenciaMedica) => void;
  onDelete: (licenciaId: string) => void;
}

// Helpers locales
const formatDate = (dateStr: string) => {
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
          📋 Licencias Médicas
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
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Fecha Carga</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {licencias.map((licencia, index) => {
              const ext = getFileExtension(licencia.documento_licencia);
              const fileConfig = FILE_TYPE_CONFIG[ext] || FILE_TYPE_CONFIG.default;
              const statusConfig = STATUS_CONFIG[licencia.estado];

              return (
                <tr key={licencia.id} className="hover:bg-blue-50 transition-colors duration-150">
                  {/* ARCHIVO */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${fileConfig.bgColor} flex items-center justify-center`}>
                        <span className="text-xl">{fileConfig.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">
                          Folio: {licencia.numero_licencia}
                        </p>
                        <p className="text-xs text-gray-500 uppercase">{ext}</p>
                      </div>
                    </div>
                  </td>

                  {/* FUNCIONARIO */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{licencia.usuario_nombre || 'No asignado'}</p>
                        <p className="text-xs text-gray-500">{licencia.area_nombre}</p>
                      </div>
                    </div>
                  </td>

                  {/* PERIODO */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <div className="text-xs text-gray-600">
                        <span className="font-medium text-gray-900">{licencia.dias_totales} días</span>
                        <div className="flex gap-1 text-gray-400">
                          <span>{formatDateSimple(licencia.fecha_inicio)}</span>
                          <span>-</span>
                          <span>{formatDateSimple(licencia.fecha_termino)}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* ESTADO */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.badge}`}>
                      {statusConfig.label}
                    </span>
                    {licencia.esta_vigente && licencia.estado === 'aprobada' && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        En curso
                      </span>
                    )}
                  </td>

                  {/* FECHA CARGA */}
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-600">{formatDate(licencia.creado_en)}</p>
                  </td>

                  {/* ACCIONES */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => onView(licencia)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDownload(licencia)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(licencia.id)} 
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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