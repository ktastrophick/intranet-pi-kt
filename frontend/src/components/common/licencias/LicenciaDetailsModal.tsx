import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, FileText, User, Building2, 
  Clock, ShieldCheck, MessageSquare, ExternalLink 
} from 'lucide-react';
import type { LicenciaMedica } from '@/types/licencia';
import { STATUS_CONFIG } from '@/types/licencia';

interface LicenciaDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  licencia: LicenciaMedica | null;
}

export const LicenciaDetailsModal: React.FC<LicenciaDetailsModalProps> = ({
  isOpen,
  onClose,
  licencia
}) => {
  if (!licencia) return null;

  const status = STATUS_CONFIG[licencia.estado];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-hidden border-0 p-0 shadow-2xl">
        {/* Header con gradiente según estado */}
        <div className={`p-6 text-white ${
          licencia.estado === 'aprobada' ? 'bg-gradient-to-r from-green-600 to-emerald-500' :
          licencia.estado === 'rechazada' ? 'bg-gradient-to-r from-red-600 to-rose-500' :
          'bg-gradient-to-r from-blue-600 to-cyan-500'
        }`}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-white">
                <FileText className="w-6 h-6" />
                Detalle de Licencia
              </DialogTitle>
              <Badge variant="outline" className="bg-white/20 text-white border-white/40 px-3 py-1 text-sm uppercase">
                {licencia.numero_licencia}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda: Información del Funcionario */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-4 h-4" /> Información del Solicitante
              </h3>
              <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Nombre Completo</p>
                  <p className="text-sm font-semibold text-gray-800">{licencia.usuario_nombre}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold text-right">Área / Departamento</p>
                  <div className="flex items-center justify-end gap-1 text-blue-600">
                    <Building2 className="w-3 h-3" />
                    <p className="text-sm font-medium">{licencia.area_nombre}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Periodo */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Período de Licencia
              </h3>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Desde</p>
                  <p className="text-sm font-bold text-gray-800">{new Date(licencia.fecha_inicio).toLocaleDateString()}</p>
                </div>
                <div className="px-3 py-1 bg-blue-100 rounded-full text-blue-700 text-xs font-bold">
                  {licencia.dias_totales} Días
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Hasta</p>
                  <p className="text-sm font-bold text-gray-800">{new Date(licencia.fecha_termino).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-100" />

          {/* Sección de Estado y Resolución */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Estado y Resolución
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border ${status.badge} flex flex-col items-center justify-center gap-1`}>
                <p className="text-[10px] uppercase font-bold opacity-70">Estado Actual</p>
                <p className="text-sm font-black">{licencia.estado.toUpperCase()}</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-1">
                <p className="text-[10px] uppercase font-bold text-gray-500">Validado Por</p>
                <p className="text-sm font-bold text-gray-700 text-center">{licencia.revisada_por_nombre || 'Pendiente'}</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-1">
                <p className="text-[10px] uppercase font-bold text-gray-500">Fecha Resolución</p>
                <p className="text-sm font-bold text-gray-700">
                  {licencia.fecha_revision ? new Date(licencia.fecha_revision).toLocaleDateString() : '-- / -- / --'}
                </p>
              </div>
            </div>

            {licencia.comentarios_revision && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                <MessageSquare className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-amber-600">Observaciones del Administrador:</p>
                  <p className="text-sm text-amber-900 leading-relaxed italic">"{licencia.comentarios_revision}"</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 bg-gray-50/50 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cerrar
          </Button>
          <Button 
            className="bg-[#009DDC] hover:bg-[#007bb1] rounded-xl flex items-center gap-2"
            onClick={() => window.open(licencia.documento_licencia, '_blank')}
          >
            <ExternalLink className="w-4 h-4" /> Ver Documento Original
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};