// ======================================================
// PÁGINA ADMIN: Aprobar/Rechazar Solicitudes
// Ubicación: src/pages/admin/AprobacionesAdminPage.tsx
// ======================================================

'use client';

import React, { useState, useEffect } from 'react';
import { UnifiedNavbar } from '@/components/common/layout/UnifiedNavbar';
import Footer from '@/components/common/layout/Footer';
import BannerAprobaciones from '@/components/images/banners_finales/BannerAprobaciones';
import {
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,

  Download,
  AlertCircle
} from 'lucide-react'; // ✅ Eliminados: User, Filter, Send (no se usaban)
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/common/multiusos/textarea';
import { useAuth } from '@/api/contexts/AuthContext';
import { solicitudService } from '@/api';
import type { Solicitud, TipoSolicitud } from '@/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ======================================================
// UTILIDADES
// ======================================================

const formatearFecha = (fecha: string): string => {
  return new Date(fecha).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const getTipoBadge = (tipo: TipoSolicitud) => {
  return tipo === 'vacaciones' ? (
    <Badge className="bg-blue-100 text-blue-800 border-blue-200 border">
      Vacaciones
    </Badge>
  ) : (
    <Badge className="bg-purple-100 text-purple-800 border-purple-200 border">
      Días Administrativos
    </Badge>
  );
};

const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case 'pendiente_jefatura':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 border flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pendiente Jefatura
        </Badge>
      );
    case 'pendiente_direccion':
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200 border flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pendiente Dirección
        </Badge>
      );
    case 'aprobada':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 border flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Aprobada
        </Badge>
      );
    case 'rechazada':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 border flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Rechazada
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200 border flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {estado}
        </Badge>
      );
  }
};

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export const AprobacionesAdminPage: React.FC = () => {
  const { user } = useAuth();

  // Estados
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  const [vistaActual, setVistaActual] = useState<'pendientes' | 'mis_aprobaciones' | 'historial_completo'>('pendientes');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'aprobar' | 'rechazar'>('aprobar');
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [comentario, setComentario] = useState('');
  const [processing, setProcessing] = useState(false);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<TipoSolicitud | 'TODOS'>('TODOS');
  const [filtroArea, setFiltroArea] = useState<string>('TODOS');

  // ======================================================
  // EFECTOS
  // ======================================================

  useEffect(() => {
    if (user?.id) {
      cargarSolicitudes();
    }
  }, [user, vistaActual]);

  useEffect(() => {
    aplicarFiltros();
  }, [solicitudes, filtroTipo, filtroArea]);

  // ======================================================
  // FUNCIONES
  // ======================================================

  const cargarSolicitudes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      
      let data: Solicitud[];
      if (vistaActual === 'pendientes') {
        data = await solicitudService.getPendientes();
      } else if (vistaActual === 'mis_aprobaciones') {
        data = await solicitudService.getMisAprobaciones();
      } else {
        data = await solicitudService.getHistorialCompleto();
      }
      
      if (vistaActual === 'pendientes') {
        const nivel = user.rol_nivel ?? 1;
        let filtradas = data;
        
        if (nivel >= 3) {
          filtradas = data.filter(s => s.estado === 'pendiente_direccion');
        } else if (nivel === 2) {
          filtradas = data.filter(s => 
            s.estado === 'pendiente_jefatura' && s.usuario_area === user.area_nombre
          );
        }
        setSolicitudes(filtradas.sort((a, b) => new Date(a.creada_en).getTime() - new Date(b.creada_en).getTime()));
      } else {
        setSolicitudes(data.sort((a, b) => new Date(b.creada_en).getTime() - new Date(a.creada_en).getTime()));
      }
    } catch (err) {
      setError('No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...solicitudes];
    if (filtroTipo !== 'TODOS') resultado = resultado.filter(s => s.tipo === filtroTipo);
    if (filtroArea !== 'TODOS') resultado = resultado.filter(s => s.usuario_area === filtroArea);
    setFilteredSolicitudes(resultado);
  };

  const abrirModal = (solicitud: Solicitud, tipo: 'aprobar' | 'rechazar') => {
    setSelectedSolicitud(solicitud);
    setModalType(tipo);
    setComentario('');
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setSelectedSolicitud(null);
    setComentario('');
  };

  const handleAprobar = async () => {
    if (!selectedSolicitud || !user) return;
    setProcessing(true);
    try {
      await solicitudService.aprobar(
        selectedSolicitud.id, 
        { aprobar: true, comentarios: comentario.trim() || undefined },
        user.rol_nivel ?? 1 // ✅ Corregido: Se agregó ?? 1 para evitar el error de 'undefined'
      );
      setSuccessMessage(`Solicitud de ${selectedSolicitud.usuario_nombre} aprobada`);
      await cargarSolicitudes();
      cerrarModal();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al aprobar');
    } finally {
      setProcessing(false);
    }
  };

  const handleRechazar = async () => {
    if (!selectedSolicitud || !user) return;
    if (!comentario.trim()) {
      setError('Debes proporcionar un motivo para rechazar');
      return;
    }
    setProcessing(true);
    try {
      await solicitudService.rechazar(
        selectedSolicitud.id, 
        { comentarios: comentario.trim() },
        user.rol_nivel ?? 1 // ✅ Corregido: Se agregó ?? 1 para evitar el error de 'undefined'
      );
      setSuccessMessage(`Solicitud de ${selectedSolicitud.usuario_nombre} rechazada`);
      await cargarSolicitudes();
      cerrarModal();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al rechazar');
    } finally {
      setProcessing(false);
    }
  };

  const areasUnicas = Array.from(new Set(solicitudes.map(s => s.usuario_area)));

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedNavbar />
      <div className="h-16" />
      <BannerAprobaciones />
      
      <div className="flex-1 bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <p className="text-sm text-gray-600">Gestión de aprobaciones administrativas.</p>
          </div>

          {successMessage && <Alert className="mb-6 bg-green-50 border-green-200 text-green-800"><CheckCircle className="h-4 w-4" /><AlertDescription>{successMessage}</AlertDescription></Alert>}
          {error && <Alert className="mb-6 bg-red-50 border-red-200 text-red-800"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg"><Clock className="w-6 h-6 text-yellow-600" /></div>
              <div><p className="text-gray-500 text-sm">Totales</p><p className="text-3xl font-bold">{solicitudes.length}</p></div>
            </div>
            {/* ... más estadísticas ... */}
          </div>

          {/* Vistas y Filtros */}
          <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col gap-4">
            <div className="flex gap-2">
              <Button onClick={() => setVistaActual('pendientes')} variant={vistaActual === 'pendientes' ? 'default' : 'outline'}>Pendientes</Button>
              <Button onClick={() => setVistaActual('mis_aprobaciones')} variant={vistaActual === 'mis_aprobaciones' ? 'default' : 'outline'}>Mis Aprobaciones</Button>
            </div>
            
            <div className="flex gap-4 border-t pt-4">
              <Select value={filtroTipo} onValueChange={(v: any) => setFiltroTipo(v)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los tipos</SelectItem>
                  <SelectItem value="vacaciones">Vacaciones</SelectItem>
                  <SelectItem value="dia_administrativo">Días Admin.</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroArea} onValueChange={setFiltroArea}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Área" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas las áreas</SelectItem>
                  {areasUnicas.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de tarjetas */}
          {loading ? (
             <div className="text-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-blue-500 mx-auto"></div></div>
          ) : filteredSolicitudes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow"><p className="text-gray-500">No hay solicitudes para mostrar.</p></div>
          ) : (
            <div className="space-y-4">
              {filteredSolicitudes.map((solicitud) => (
                <div key={solicitud.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg"><CalendarDays className="text-blue-500" /></div>
                      <div>
                        <div className="flex gap-2 mb-1">{getTipoBadge(solicitud.tipo)}{getEstadoBadge(solicitud.estado)}</div>
                        <p className="text-xs text-gray-500">{formatearFecha(solicitud.creada_en)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg text-sm mb-4">
                    <div><p className="text-gray-500">Solicitante</p><p className="font-bold">{solicitud.usuario_nombre}</p></div>
                    <div><p className="text-gray-500">Área</p><p className="font-bold">{solicitud.usuario_area}</p></div>
                    <div><p className="text-gray-500">Días</p><p className="font-bold">{solicitud.cantidad_dias}</p></div>
                  </div>

                  <div className="bg-white border rounded-lg p-4 mb-4">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Motivo</p>
                    <p className="text-sm">{solicitud.motivo}</p>
                  </div>

                  {/* Fechas de aprobación */}
                  <div className="grid md:grid-cols-2 gap-4 text-xs mb-4">
                    <div className="p-3 bg-gray-50 rounded border">
                      <p className="font-bold text-gray-500 mb-1">JEFATURA</p>
                      <p>{solicitud.jefatura_aprobador_nombre || 'Pendiente'}</p>
                      {solicitud.fecha_aprobacion_jefatura && <p className="text-blue-600">{formatearFecha(solicitud.fecha_aprobacion_jefatura)}</p>}
                    </div>
                    <div className="p-3 bg-gray-50 rounded border">
                      <p className="font-bold text-gray-500 mb-1">DIRECCIÓN</p>
                      <p>{solicitud.direccion_aprobador_nombre || 'Pendiente'}</p>
                      {solicitud.fecha_aprobacion_direccion && <p className="text-blue-600">{formatearFecha(solicitud.fecha_aprobacion_direccion)}</p>}
                    </div>
                  </div>

                  {solicitud.url_pdf && (
                    <Button variant="outline" size="sm" onClick={() => window.open(solicitud.url_pdf, '_blank')} className="mb-4">
                      <Download className="w-4 h-4 mr-2" /> Ver PDF
                    </Button>
                  )}

                  {vistaActual === 'pendientes' && (
                    <div className="flex gap-3 pt-4 border-t">
                      <Button onClick={() => abrirModal(solicitud, 'aprobar')} className="flex-1 bg-green-600 hover:bg-green-700">Aprobar</Button>
                      <Button onClick={() => abrirModal(solicitud, 'rechazar')} variant="outline" className="flex-1 text-red-600 border-red-600">Rechazar</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Acción */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalType === 'aprobar' ? 'Aprobar' : 'Rechazar'} Solicitud</DialogTitle>
            <DialogDescription>{selectedSolicitud && `Usuario: ${selectedSolicitud.usuario_nombre}`}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Comentarios {modalType === 'rechazar' && '(Obligatorio)'}</Label>
            <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Escriba aquí..." rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cerrarModal}>Cancelar</Button>
            <Button 
              onClick={modalType === 'aprobar' ? handleAprobar : handleRechazar} 
              disabled={processing || (modalType === 'rechazar' && !comentario.trim())}
              className={modalType === 'aprobar' ? 'bg-green-600' : 'bg-red-600'}
            >
              {processing ? 'Procesando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AprobacionesAdminPage;