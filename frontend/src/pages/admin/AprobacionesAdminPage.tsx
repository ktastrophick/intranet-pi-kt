// src/pages/admin/AprobacionesAdminPage.tsx

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
  AlertCircle
} from 'lucide-react'; 
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

const formatearFecha = (fecha: string): string => {
  return new Date(fecha).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const getTipoBadge = (tipo: TipoSolicitud) => {
  const labels: Record<string, string> = {
    'vacaciones': 'Vacaciones',
    'dia_administrativo': 'Día Administrativo',
    'permiso_sin_goce': 'Permiso Sin Goce',
    'devolucion_tiempo': 'Devolución de Tiempo',
    'otro_permiso': 'Otro Permiso'
  };
  return (
    <Badge className="bg-blue-100 text-blue-800 border-blue-200 border">
      {labels[tipo] || tipo}
    </Badge>
  );
};

const getEstadoBadge = (estado: string) => {
  const config: Record<string, { label: string; color: string; icon: any }> = {
    pendiente_jefatura: { label: 'Pte. Jefatura', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    pendiente_direccion: { label: 'Pte. Dirección', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock },
    aprobada: { label: 'Aprobada', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
    rechazada: { label: 'Rechazada', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  };

  const item = config[estado] || { label: estado, color: 'bg-gray-100 text-gray-800', icon: Clock };
  const Icon = item.icon;

  return (
    <Badge className={`${item.color} border flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {item.label}
    </Badge>
  );
};

export const AprobacionesAdminPage: React.FC = () => {
  const { user } = useAuth();

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [vistaActual, setVistaActual] = useState<'pendientes' | 'mis_aprobaciones' | 'historial_completo'>('pendientes');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'aprobar' | 'rechazar'>('aprobar');
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [comentario, setComentario] = useState('');
  const [processing, setProcessing] = useState(false);

  const [filtroTipo, setFiltroTipo] = useState<TipoSolicitud | 'TODOS'>('TODOS');
  const [filtroArea, setFiltroArea] = useState<string>('TODOS');

  useEffect(() => {
    if (user?.id) cargarSolicitudes();
  }, [user, vistaActual]);

  useEffect(() => {
    aplicarFiltros();
  }, [solicitudes, filtroTipo, filtroArea]);

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

  const handleAccion = async () => {
    if (!selectedSolicitud || !user) return;
    if (modalType === 'rechazar' && !comentario.trim()) {
      setError('El comentario es obligatorio para rechazar.');
      return;
    }

    setProcessing(true);
    try {
      // ✅ FIX: Usamos ?? 1 para asegurar que siempre sea un número (elimina error TS)
      const nivelUsuario = user.rol_nivel ?? 1;

      if (modalType === 'aprobar') {
        await solicitudService.aprobar(
          selectedSolicitud.id, 
          { aprobar: true, comentarios: comentario }, 
          nivelUsuario
        );
      } else {
        await solicitudService.rechazar(
          selectedSolicitud.id, 
          { comentarios: comentario }, 
          nivelUsuario
        );
      }
      
      setSuccessMessage(`Solicitud de ${selectedSolicitud.usuario_nombre} ${modalType === 'aprobar' ? 'aprobada' : 'rechazada'}`);
      await cargarSolicitudes();
      setModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setError('Error al procesar la solicitud.');
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
      
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        {successMessage && <Alert className="mb-6 bg-green-50 text-green-800 border-green-200"><CheckCircle className="h-4 w-4" /><AlertDescription>{successMessage}</AlertDescription></Alert>}
        {error && <Alert className="mb-6 bg-red-50 text-red-800 border-red-200"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <Button onClick={() => setVistaActual('pendientes')} variant={vistaActual === 'pendientes' ? 'default' : 'outline'}>Pendientes</Button>
            <Button onClick={() => setVistaActual('mis_aprobaciones')} variant={vistaActual === 'mis_aprobaciones' ? 'default' : 'outline'}>Historial</Button>
          </div>
          
          <div className="flex gap-4">
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

        {loading ? (
          <div className="text-center py-20"><div className="animate-spin h-10 w-10 border-b-2 border-blue-600 mx-auto" /></div>
        ) : filteredSolicitudes.length === 0 ? (
          <div className="bg-white rounded-lg p-20 text-center text-gray-500 border shadow-sm">No hay solicitudes en esta sección.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSolicitudes.map((sol) => (
              <div key={sol.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg"><CalendarDays className="text-blue-600 w-6 h-6" /></div>
                    <div>
                      <div className="flex gap-2 mb-1">{getTipoBadge(sol.tipo)}{getEstadoBadge(sol.estado)}</div>
                      <p className="text-xs text-gray-400">Solicitado el {formatearFecha(sol.creada_en)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-700">{sol.cantidad_dias} días</span>
                    <p className="text-xs text-gray-400">Nº {sol.numero_solicitud}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg mb-4">
                  <div><p className="text-xs text-gray-400 uppercase font-bold">Funcionario</p><p className="font-semibold text-gray-800">{sol.usuario_nombre}</p></div>
                  <div><p className="text-xs text-gray-400 uppercase font-bold">Área</p><p className="text-gray-700">{sol.usuario_area}</p></div>
                  <div><p className="text-xs text-gray-400 uppercase font-bold">Periodo</p><p className="text-gray-700">{formatearFecha(sol.fecha_inicio)} al {formatearFecha(sol.fecha_termino)}</p></div>
                </div>

                <div className="mb-6">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Motivo / Justificación</p>
                  <p className="text-sm text-gray-600 italic">"{sol.motivo}"</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className={`p-3 rounded-lg border ${sol.jefatura_aprobador_nombre ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Visto Jefatura</p>
                    <p className="text-sm font-medium">{sol.jefatura_aprobador_nombre || 'Pendiente'}</p>
                  </div>
                  <div className={`p-3 rounded-lg border ${sol.direccion_aprobador_nombre ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Visto Dirección</p>
                    <p className="text-sm font-medium">{sol.direccion_aprobador_nombre || 'Pendiente'}</p>
                  </div>
                </div>

                {vistaActual === 'pendientes' && (
                  <div className="flex gap-4 pt-4 border-t">
                    <Button onClick={() => abrirModal(sol, 'aprobar')} className="flex-1 bg-green-600 hover:bg-green-700 text-white">Aprobar</Button>
                    <Button onClick={() => abrirModal(sol, 'rechazar')} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">Rechazar</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalType === 'aprobar' ? 'Aprobar' : 'Rechazar'} Solicitud</DialogTitle>
            <DialogDescription>
              {selectedSolicitud && `Se procesará la solicitud Nº ${selectedSolicitud.numero_solicitud} de ${selectedSolicitud.usuario_nombre}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Comentarios {modalType === 'rechazar' && '(Obligatorio para rechazar)'}</Label>
              <Textarea 
                value={comentario} 
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Escribe un comentario o motivo..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleAccion} 
              disabled={processing || (modalType === 'rechazar' && !comentario.trim())}
              className={modalType === 'aprobar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {processing ? 'Procesando...' : 'Confirmar Acción'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AprobacionesAdminPage;