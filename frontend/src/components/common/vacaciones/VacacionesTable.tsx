// ======================================================
// COMPONENTE: VacacionesTable
// Ubicación: src/components/common/vacaciones/VacacionesTable.tsx
// ======================================================

import { useState, useMemo, useEffect } from 'react';
import { StateColorButton } from './StateColorButton';
import { Search, Filter, FileText, Download, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { solicitudService } from '@/api';
import type { Solicitud, EstadoSolicitud, TipoSolicitud } from '@/api';

export function VacacionesTable() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  
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
      setError('No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
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

  const handleDescargarPDF = async (id: string, numero: string) => {
    try {
      setDownloadingId(id);
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
      alert('Error al descargar el PDF');
    } finally {
      setDownloadingId(null);
    }
  };

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

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      {/* Buscador y Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            placeholder="Buscar por número o tipo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select className="border rounded-lg px-3" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="todos">Todos los tipos</option>
            <option value="vacaciones">Vacaciones</option>
            <option value="dia_administrativo">Días Administrativos</option>
          </select>
          <select className="border rounded-lg px-3" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos los estados</option>
            <option value="pendiente_jefatura">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold border-b">
            <tr>
              <th className="px-6 py-4">Nº Solicitud</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Periodo</th>
              <th className="px-6 py-4">Días/Hrs</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Jefatura</th>
              <th className="px-6 py-4">Dirección</th>
              <th className="px-6 py-4 text-center">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {solicitudesFiltradas.map(sol => (
              <tr key={sol.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium">{sol.numero_solicitud}</td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">{sol.tipo_display}</Badge>
                </td>
                <td className="px-6 py-4">{formatearFecha(sol.fecha_inicio)} - {formatearFecha(sol.fecha_termino)}</td>
                <td className="px-6 py-4">{sol.cantidad_dias}</td>
                <td className="px-6 py-4"><StateColorButton estado={mapearEstado(sol.estado)} /></td>
                <td className="px-6 py-4 text-gray-500">{sol.jefatura_aprobador_nombre || <span className="italic text-gray-300">Pendiente</span>}</td>
                <td className="px-6 py-4 text-gray-500">{sol.direccion_aprobador_nombre || <span className="italic text-gray-300">Pendiente</span>}</td>
                <td className="px-6 py-4 text-center">
                  {sol.estado === 'aprobada' ? (
                    <button 
                      disabled={downloadingId === sol.id}
                      onClick={() => handleDescargarPDF(sol.id, sol.numero_solicitud)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      {downloadingId === sol.id ? <Loader2 className="animate-spin h-5 w-5" /> : <Download className="h-5 w-5" />}
                    </button>
                  ) : <span className="text-gray-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}