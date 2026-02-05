// src/pages/admin/AprobacionesAdminPage.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UnifiedNavbar } from '@/components/common/layout/UnifiedNavbar';
import Footer from '@/components/common/layout/Footer';
import BannerAprobaciones from '@/components/images/banners_finales/BannerAprobaciones';
import {
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  History,
  ShieldCheck,
  ListFilter
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

// Tipos de vista extendidos
type VistaAprobacion = 'pendientes' | 'mis_acciones' | 'historial_institucional';

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
    anulada_por_licencia: { label: 'Anulada p/ Licencia', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle },
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
  const nivelUsuario = user?.rol_nivel ?? 1;

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [vistaActual, setVistaActual] = useState<VistaAprobacion>('pendientes');

  // Modales y procesamiento
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'aprobar' | 'rechazar'>('aprobar');
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [comentario, setComentario] = useState('');
  const [processing, setProcessing] = useState(false);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<TipoSolicitud | 'TODOS'>('TODOS');
  const [filtroArea, setFiltroArea] = useState<string>('TODOS');

  useEffect(() => {
    if (user?.id) cargarSolicitudes();
  }, [user, vistaActual]);

  const cargarSolicitudes = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      
      // Obtenemos todo el universo de lo que el usuario puede ver según backend
      const data = await solicitudService.getAll();
      setSolicitudes(data);

    } catch (err) {
      setError('No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  };

  // Lógica de filtrado avanzada por sección
  const solicitudesFiltradas = useMemo(() => {
    let result = [...solicitudes];

    // 1. Filtrado por Pestaña/Vista
    if (vistaActual === 'pendientes') {
      if (nivelUsuario >= 3) {
        result = result.filter(s => s.estado === 'pendiente_direccion');
      } else if (nivelUsuario === 2) {
        result = result.filter(s => s.estado === 'pendiente_jefatura' && s.usuario_area === user?.area_nombre);
      }
    } 
    else if (vistaActual === 'mis_acciones') {
      // Filtra donde el usuario actual fue el que aprobó/rechazó
      // Usamos el nombre completo para comparar si no tenemos el ID directo en el objeto
      result = result.filter(s => 
        (s.jefatura_aprobador_nombre === user?.nombre_completo || 
         s.direccion_aprobador_nombre === user?.nombre_completo) &&
        ['aprobada', 'rechazada', 'anulada_por_licencia'].includes(s.estado)
      );
    } 
    else if (vistaActual === 'historial_institucional') {
      // Todas las solicitudes procesadas (solo para Nivel 3+)
      result = result.filter(s => !s.estado.startsWith('pendiente'));
    }

    // 2. Aplicar filtros de búsqueda adicionales
    if (filtroTipo !== 'TODOS') result = result.filter(s => s.tipo === filtroTipo);
    if (filtroArea !== 'TODOS') result = result.filter(s => s.usuario_area === filtroArea);

    // 3. Orden: Pendientes por fecha más antigua, Historial por más reciente
    return result.sort((a, b) => {
      const dateA = new Date(a.creada_en).getTime();
      const dateB = new Date(b.creada_en).getTime();
      return vistaActual === 'pendientes' ? dateA - dateB : dateB - dateA;
    });
  }, [solicitudes, vistaActual, filtroTipo, filtroArea, user, nivelUsuario]);

  const areasUnicas = Array.from(new Set(solicitudes.map(s => s.usuario_area))).sort();

  const handleAccion = async () => {
    if (!selectedSolicitud || !user) return;
    if (modalType === 'rechazar' && !comentario.trim()) {
      setError('El comentario es obligatorio para rechazar.');
      return;
    }

    setProcessing(true);
    try {
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedNavbar />
      <div className="h-16" />
      <BannerAprobaciones />
      
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        {successMessage && (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert className="mb-6 bg-red-50 text-red-800 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* --- NAVEGACIÓN DE SECCIONES --- */}
        <div className="bg-white rounded-xl shadow-sm border p-2 mb-6 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <Button 
              variant={vistaActual === 'pendientes' ? 'default' : 'ghost'} 
              onClick={() => setVistaActual('pendientes')}
              className="flex gap-2"
            >
              <Clock className="w-4 h-4" /> Pendientes
            </Button>
            
            <Button 
              variant={vistaActual === 'mis_acciones' ? 'default' : 'ghost'} 
              onClick={() => setVistaActual('mis_acciones')}
              className="flex gap-2"
            >
              <ShieldCheck className="w-4 h-4" /> Mis Acciones
            </Button>

            {nivelUsuario >= 3 && (
              <Button 
                variant={vistaActual === 'historial_institucional' ? 'default' : 'ghost'} 
                onClick={() => setVistaActual('historial_institucional')}
                className="flex gap-2"
              >
                <History className="w-4 h-4" /> Historial Institucional
              </Button>
            )}
          </div>
          
          <div className="flex gap-2 ml-auto">
            <Select value={filtroTipo} onValueChange={(v: any) => setFiltroTipo(v)}>
              <SelectTrigger className="w-[160px] h-9"><ListFilter className="w-3 h-3 mr-2"/> <SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los tipos</SelectItem>
                <SelectItem value="vacaciones">Vacaciones</SelectItem>
                <SelectItem value="dia_administrativo">Días Admin.</SelectItem>
                <SelectItem value="permiso_sin_goce">Sin Goce</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroArea} onValueChange={setFiltroArea}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Área" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas las áreas</SelectItem>
                {areasUnicas.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* --- LISTADO --- */}
        {loading ? (
          <div className="text-center py-20"><div className="animate-spin h-10 w-10 border-b-2 border-blue-600 mx-auto" /></div>
        ) : solicitudesFiltradas.length === 0 ? (
          <div className="bg-white rounded-lg p-20 text-center text-gray-400 border border-dashed">
            No se encontraron solicitudes en la sección "{vistaActual.replace('_', ' ')}".
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {solicitudesFiltradas.map((sol) => (
              <div key={sol.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-all border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg"><CalendarDays className="text-blue-600 w-6 h-6" /></div>
                    <div>
                      <div className="flex flex-wrap gap-2 mb-1">
                        {getTipoBadge(sol.tipo)}
                        {getEstadoBadge(sol.estado)}
                      </div>
                      <p className="text-xs text-gray-400">Solicitado el {formatearFecha(sol.creada_en)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-gray-800">{sol.cantidad_dias} {sol.tipo === 'devolucion_tiempo' ? 'Hrs' : 'Días'}</span>
                    <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">{sol.numero_solicitud}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg mb-4">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Funcionario</p>
                    <p className="font-semibold text-gray-800 leading-tight">{sol.usuario_nombre}</p>
                    <p className="text-xs text-gray-500">{sol.usuario_cargo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Área</p>
                    <p className="text-sm text-gray-700">{sol.usuario_area}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Periodo</p>
                    <p className="text-sm text-gray-700 font-medium">
                      {formatearFecha(sol.fecha_inicio)} al {formatearFecha(sol.fecha_termino)}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Justificación del Funcionario</p>
                  <p className="text-sm text-gray-600 italic bg-white p-3 border rounded-md">
                    "{sol.motivo || 'Sin descripción'}"
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className={`p-3 rounded-lg border ${sol.jefatura_aprobador_nombre ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Visto Jefatura Directa</p>
                    <p className="text-sm font-medium">{sol.jefatura_aprobador_nombre || '---'}</p>
                    {sol.fecha_aprobacion_jefatura && <p className="text-[10px] text-gray-400">{formatearFecha(sol.fecha_aprobacion_jefatura)}</p>}
                  </div>
                  <div className={`p-3 rounded-lg border ${sol.direccion_aprobador_nombre ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Visto Dirección / Subdirección</p>
                    <p className="text-sm font-medium">{sol.direccion_aprobador_nombre || '---'}</p>
                    {sol.fecha_aprobacion_direccion && <p className="text-[10px] text-gray-400">{formatearFecha(sol.fecha_aprobacion_direccion)}</p>}
                  </div>
                </div>

                {sol.comentarios_administracion && (
                  <div className="mb-6 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm">
                    <span className="font-bold text-yellow-800">Comentario Resolución: </span>
                    <span className="text-yellow-700">{sol.comentarios_administracion}</span>
                  </div>
                )}

                {vistaActual === 'pendientes' && (
                  <div className="flex gap-4 pt-4 border-t">
                    <Button 
                      onClick={() => { setSelectedSolicitud(sol); setModalType('aprobar'); setComentario(''); setModalOpen(true); }} 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                    >
                      Aprobar Solicitud
                    </Button>
                    <Button 
                      onClick={() => { setSelectedSolicitud(sol); setModalType('rechazar'); setComentario(''); setModalOpen(true); }} 
                      variant="outline" 
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 font-bold"
                    >
                      Rechazar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL DE ACCIÓN --- */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={modalType === 'aprobar' ? 'text-green-700' : 'text-red-700'}>
              {modalType === 'aprobar' ? 'Aprobar' : 'Rechazar'} Solicitud Nº {selectedSolicitud?.numero_solicitud}
            </DialogTitle>
            <DialogDescription>
              Funcionario: <strong>{selectedSolicitud?.usuario_nombre}</strong><br/>
              Días: {selectedSolicitud?.cantidad_dias} de {selectedSolicitud?.tipo.replace('_', ' ')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Comentarios {modalType === 'rechazar' && '(Obligatorio)'}</Label>
              <Textarea 
                value={comentario} 
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Escribe el motivo del rechazo o alguna observación para la aprobación..."
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
              {processing ? 'Procesando...' : 'Confirmar Resolución'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AprobacionesAdminPage;