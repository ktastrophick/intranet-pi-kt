import React, { useState, useEffect } from 'react';
import api from '@/api/axios';
import { toast } from 'sonner';
import { 
  Loader2, CheckCircle, XCircle, Eye, 
  ClipboardCheck, Clock, History, UserCheck, 
  FileText, Search, Filter
} from 'lucide-react';
import { UnifiedNavbar } from '@/components/common/layout/UnifiedNavbar';
import Footer from '@/components/common/layout/Footer';
import BannerLicencias from '@/components/images/banners_finales/BannerLicencias';
import { useAuth } from '@/api/contexts/AuthContext';

type TabType = 'pendientes' | 'mis-gestiones' | 'historial-global';

export const LicenciasAdminPage = () => {
  const { user } = useAuth(); // Obtenemos el usuario logueado
  const [activeTab, setActiveTab] = useState<TabType>('pendientes');
  const [licencias, setLicencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLicencia, setSelectedLicencia] = useState<any>(null);
  const [comentarios, setComentarios] = useState('');

  // Cargar datos según la pestaña activa
  const fetchLicencias = async () => {
    try {
      setLoading(true);
      let url = '/licencias/';
      
      if (activeTab === 'pendientes') {
        url += '?estado=pendiente';
      } else if (activeTab === 'mis-gestiones') {
        // Asumiendo que el backend permite filtrar por el administrador que gestionó
        url += `?gestionado_por=${user?.id}`;
      } else if (activeTab === 'historial-global') {
        // Traer todas las que NO están pendientes
        url += '?excluir_estado=pendiente';
      }

      const response = await api.get(url);
      setLicencias(response.data);
    } catch (error) {
      toast.error("Error al cargar la información");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicencias();
  }, [activeTab]);

  const handleGestionar = async (id: string, nuevoEstado: 'aprobada' | 'rechazada') => {
    if (nuevoEstado === 'rechazada' && !comentarios) {
      toast.error("Debes agregar un comentario para rechazar");
      return;
    }

    try {
      await api.post(`/licencias/${id}/gestionar-licencia/`, {
        nuevo_estado: nuevoEstado,
        comentarios: comentarios
      });
      toast.success(`Licencia ${nuevoEstado} exitosamente`);
      setLicencias(licencias.filter((l: any) => l.id !== id));
      setSelectedLicencia(null);
      setComentarios('');
    } catch (error) {
      toast.error("Error al procesar la solicitud");
    }
  };

  // Renderizado de Badge de estado para los historiales
  const StatusBadge = ({ estado }: { estado: string }) => {
    const styles: any = {
      aprobada: "bg-green-100 text-green-700 border-green-200",
      rechazada: "bg-red-100 text-red-700 border-red-200",
      pendiente: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${styles[estado] || styles.pendiente}`}>
        {estado.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <UnifiedNavbar />
      <div className="h-16" />
      <BannerLicencias />

      <main className="flex-1 bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          
          {/* Header Administrativo */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-800">Panel de Control de Licencias</h1>
                <p className="text-sm text-gray-600">Gestión y auditoría de documentos médicos</p>
              </div>
              
              {/* Tabs de Navegación Interna */}
              <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                {[
                  { id: 'pendientes', label: 'Pendientes', icon: Clock },
                  { id: 'mis-gestiones', label: 'Mis Gestiones', icon: UserCheck },
                  { id: 'historial-global', label: 'Historial Global', icon: History },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id 
                      ? "bg-white text-[#009DDC] shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabla de Datos */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-white">
            {loading ? (
              <div className="flex flex-col items-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-[#009DDC] mb-4" />
                <p className="text-gray-500 font-medium">Sincronizando con la base de datos...</p>
              </div>
            ) : licencias.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="p-4 font-semibold text-gray-600 text-sm">Funcionario</th>
                      <th className="p-4 font-semibold text-gray-600 text-sm">Folio</th>
                      <th className="p-4 font-semibold text-gray-600 text-sm">Fechas</th>
                      {activeTab !== 'pendientes' && (
                        <th className="p-4 font-semibold text-gray-600 text-sm">Estado / Gestionado por</th>
                      )}
                      <th className="p-4 font-semibold text-gray-600 text-sm text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {licencias.map((l: any) => (
                      <tr key={l.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="p-4 font-medium text-gray-700">{l.usuario_nombre}</td>
                        <td className="p-4">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200">
                            {l.numero_licencia}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-600">
                          <div className="flex flex-col">
                            <span>Inic: {new Date(l.fecha_inicio).toLocaleDateString()}</span>
                            <span>Térm: {new Date(l.fecha_termino).toLocaleDateString()}</span>
                          </div>
                        </td>
                        {activeTab !== 'pendientes' && (
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <StatusBadge estado={l.estado} />
                              <span className="text-[10px] text-gray-400 italic">
                                Por: {l.nombre_administrador || 'Sistema'}
                              </span>
                            </div>
                          </td>
                        )}
                        <td className="p-4">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => window.open(l.documento_licencia, '_blank')}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Ver PDF"
                            >
                              <Eye size={18} />
                            </button>
                            {activeTab === 'pendientes' && (
                              <button 
                                onClick={() => setSelectedLicencia(l)}
                                className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-[#009DDC] transition-all shadow-sm"
                              >
                                GESTIONAR
                              </button>
                            )}
                            {activeTab !== 'pendientes' && l.comentarios && (
                                <button 
                                  onClick={() => toast.info(`Obs: ${l.comentarios}`)}
                                  className="p-2 text-gray-400 hover:text-gray-600"
                                  title="Ver Observaciones"
                                >
                                  <FileText size={18} />
                                </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="bg-gray-50 p-6 rounded-full mb-4 border border-gray-100 shadow-inner">
                  <Search className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">No hay registros</h3>
                <p className="text-gray-500 max-w-xs mx-auto text-sm">
                  No se encontraron licencias en la categoría "{activeTab.replace('-', ' ')}".
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Gestión (Se mantiene igual pero con estilo unificado) */}
      {selectedLicencia && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-white">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <ClipboardCheck size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Procesar Solicitud</h2>
              </div>
              <button onClick={() => setSelectedLicencia(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Funcionario</p>
                    <p className="text-gray-800 font-semibold">{selectedLicencia.usuario_nombre}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">N° Licencia</p>
                    <p className="text-gray-800 font-mono font-semibold">{selectedLicencia.numero_licencia}</p>
                  </div>
                </div>
              </div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Observaciones Administrativas
              </label>
              <textarea
                className="w-full border border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-[#009DDC] focus:border-transparent outline-none transition-all resize-none bg-gray-50/30 text-sm"
                rows={4}
                placeholder="Indique los motivos de la decisión o comentarios adicionales..."
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
              />
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button 
                  onClick={() => handleGestionar(selectedLicencia.id, 'rechazada')}
                  className="flex items-center justify-center gap-2 py-3.5 bg-white text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors border-2 border-red-100"
                >
                  <XCircle size={18}/> Rechazar
                </button>
                <button 
                  onClick={() => handleGestionar(selectedLicencia.id, 'aprobada')}
                  className="flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#009DDC] to-[#4DFFF3] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-200 transition-all"
                >
                  <CheckCircle size={18}/> Aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};