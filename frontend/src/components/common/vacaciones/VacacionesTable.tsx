// ======================================================
// COMPONENTE: VacacionesTable
// Ubicación: src/components/common/vacaciones/VacacionesTable.tsx
// ======================================================

import { useState, useMemo, useEffect } from 'react';
import { StateColorButton } from './StateColorButton';
import { Search, Download, Loader2, Eye, FileText, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { solicitudService } from '@/api';
import type { Solicitud, EstadoSolicitud } from '@/api';

export function VacacionesTable() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const data = await solicitudService.getMisSolicitudes();
      setSolicitudes(data);
    } catch (err) {
      console.error('Error al cargar solicitudes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerPDF = async (id: string) => {
    try {
      setProcessingId(id);
      const blob = await solicitudService.descargarPDF(id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      alert('Error al generar la previsualización del PDF');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDescargarPDF = async (id: string, numero: string) => {
    try {
      setProcessingId(id);
      const blob = await solicitudService.descargarPDF(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Solicitud_${numero}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al descargar el archivo PDF');
    } finally {
      setProcessingId(null);
    }
  };

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter(sol => {
      const cumpleBusqueda = 
        sol.numero_solicitud?.toLowerCase().includes(busqueda.toLowerCase()) ||
        sol.tipo_display?.toLowerCase().includes(busqueda.toLowerCase());
      
      const cumpleTipo = filtroTipo === 'todos' || sol.tipo === filtroTipo;
      const cumpleEstado = filtroEstado === 'todos' || sol.estado === filtroEstado;
      
      return cumpleBusqueda && cumpleTipo && cumpleEstado;
    });
  }, [solicitudes, busqueda, filtroTipo, filtroEstado]);

  const mapearEstado = (estado: EstadoSolicitud): string => {
    const mapeo: Record<string, string> = {
      'pendiente_jefatura': 'Pendiente Jefatura',
      'pendiente_direccion': 'Pendiente Dirección',
      'aprobada': 'Aprobada',
      'rechazada': 'Rechazada',
      'anulada_usuario': 'Anulada',
      'anulada_por_licencia': 'Anulada por Licencia'
    };
    return mapeo[estado] || estado;
  };

  const formatearFecha = (fecha: string) => new Date(fecha).toLocaleDateString('es-CL');

  if (loading) return (
    <div className="p-20 text-center">
      <Loader2 className="animate-spin mx-auto h-10 w-10 text-blue-500 mb-4" />
      <p className="text-gray-500">Cargando solicitudes...</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Buscador y Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            placeholder="Buscar solicitud..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="todos">Todos los tipos</option>
            <option value="vacaciones">Vacaciones</option>
            <option value="dia_administrativo">Días Administrativos</option>
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos los estados</option>
            <option value="pendiente_jefatura">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b">
              <tr>
                <th className="px-6 py-4">Nº Solicitud</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Periodo</th>
                <th className="px-6 py-4">Días/Hrs</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Visto Jefatura</th>
                <th className="px-6 py-4">Visto Dirección</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {solicitudesFiltradas.map(sol => (
                <tr key={sol.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-700">{sol.numero_solicitud}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">{sol.tipo_display}</Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatearFecha(sol.fecha_inicio)} - {formatearFecha(sol.fecha_termino)}
                  </td>
                  <td className="px-6 py-4 font-semibold">{sol.cantidad_dias}</td>
                  <td className="px-6 py-4"><StateColorButton estado={mapearEstado(sol.estado)} /></td>
                  
                  {/* COLUMNA JEFATURA */}
                  <td className="px-6 py-4">
                    {sol.jefatura_aprobador_nombre ? (
                      <div className="flex items-center gap-1.5 text-green-700 font-medium">
                        <UserCheck className="w-3.5 h-3.5" />
                        {sol.jefatura_aprobador_nombre}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Pendiente</span>
                    )}
                  </td>

                  {/* COLUMNA DIRECCIÓN */}
                  <td className="px-6 py-4">
                    {sol.direccion_aprobador_nombre ? (
                      <div className="flex items-center gap-1.5 text-green-700 font-medium">
                        <UserCheck className="w-3.5 h-3.5" />
                        {sol.direccion_aprobador_nombre}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Pendiente</span>
                    )}
                  </td>

                  {/* ACCIONES PDF */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center items-center gap-1">
                      {sol.estado === 'aprobada' ? (
                        <>
                          <button 
                            onClick={() => handleVerPDF(sol.id)}
                            disabled={processingId !== null}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Visualizar"
                          >
                            {processingId === sol.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button 
                            onClick={() => handleDescargarPDF(sol.id, sol.numero_solicitud)}
                            disabled={processingId !== null}
                            className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            title="Descargar"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <FileText className="h-4 w-4 text-gray-200 mx-auto" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}