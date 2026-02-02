// ======================================================
// COMPONENTE: AnnouncementDetailsModal
// Ubicación: src/components/common/anuncios/AnnouncementDetailsModal.tsx
// Descripción: Modal que muestra todos los detalles de un anuncio
// ======================================================

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Announcement } from '@/types/announcement';
import { CATEGORY_CONFIG } from '@/types/announcement';
import { AttachmentLink } from './AttachmentLink';
import { 
  Calendar, 
  Paperclip, 
  User, 
  Shield, 
  Users, 
  Clock
} from 'lucide-react';

// ======================================================
// INTERFACES
// ======================================================

interface AnnouncementDetailsModalProps {
  announcement: Announcement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ======================================================
// FUNCIONES AUXILIARES
// ======================================================

/**
 * Formatea la fecha de publicación
 */
const formatPublicationDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('es-ES', options);
};

/**
 * Calcula hace cuánto tiempo fue publicado
 */


/**
 * Calcula los días restantes hasta la expiración
 */
const getDaysRemaining = (expirationDate: Date): number => {
  const now = new Date();
  const diffInMs = expirationDate.getTime() - now.getTime();
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
};

/**
 * Verifica si el anuncio está vigente
 */
const isAnnouncementActive = (expirationDate: Date | null | undefined): boolean => {
  if (!expirationDate) return true;
  const now = new Date();
  return expirationDate.getTime() > now.getTime();
};

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export const AnnouncementDetailsModal: React.FC<AnnouncementDetailsModalProps> = ({
  announcement,
  open,
  onOpenChange,
}) => {
  if (!announcement) return null;

  const categoryConfig = announcement.category 
    ? CATEGORY_CONFIG[announcement.category]
    : null;

  const isActive = isAnnouncementActive(announcement.expirationDate);
  const daysRemaining = announcement.expirationDate ? getDaysRemaining(announcement.expirationDate) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white">
        {/* ======================================================
            CABECERA
            ====================================================== */}
        <DialogHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 -mx-6 -mt-6 px-6 py-6 mb-6 border-b-2 border-blue-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-3">
                {announcement.title}
              </DialogTitle>
              
              {/* Badge de categoría */}
              {categoryConfig && (
                <div className={`
                  inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold
                  border ${categoryConfig.badge}
                `}>
                  <span>{categoryConfig.icon}</span>
                  <span>{categoryConfig.label}</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* ======================================================
            CONTENIDO
            ====================================================== */}
        <div className="space-y-6 px-2">
          
          {/* ======================================================
              INFORMACIÓN DEL ANUNCIO
              ====================================================== */}
          <div className="space-y-3">
            
            {/* Fecha de publicación */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-[#009DDC] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">Fecha de Publicación</p>
                <p className="text-sm text-gray-600">
                  {formatPublicationDate(announcement.publicationDate)}
                  
                </p>
              </div>
            </div>

            {/* Autor del anuncio */}
            {announcement.authorName && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-[#009DDC] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700">Publicado por</p>
                  <p className="text-sm text-gray-600">{announcement.authorName}</p>
                </div>
              </div>
            )}

            {/* Visibilidad por Roles */}
            {announcement.visibilidadRolesDisplay && (
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700">Visible para</p>
                  <p className="text-sm text-gray-600">{announcement.visibilidadRolesDisplay}</p>
                </div>
              </div>
            )}

            {/* Áreas Destinatarias */}
            {announcement.paraTodasAreas !== undefined && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700">Áreas Destinatarias</p>
                  <p className="text-sm text-gray-600">
                    {announcement.paraTodasAreas ? (
                      'Todas las áreas'
                    ) : announcement.areasDestinatarias && announcement.areasDestinatarias.length > 0 ? (
                      announcement.areasDestinatarias.join(', ')
                    ) : (
                      'No especificadas'
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Fecha de Expiración */}
            {announcement.expirationDate && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700">Vigencia del Anuncio</p>
                  <div className="flex items-center gap-2 text-sm">
                    {isActive ? (
                      daysRemaining !== null && daysRemaining > 0 ? (
                        <span className="text-green-600 font-semibold">
                          {daysRemaining === 1 
                            ? '✓ Expira mañana' 
                            : `✓ ${daysRemaining} días restantes`}
                        </span>
                      ) : daysRemaining === 0 ? (
                        <span className="text-orange-600 font-semibold">⚠ Expira hoy</span>
                      ) : (
                        <span className="text-red-600 font-semibold">✗ Expirado</span>
                      )
                    ) : (
                      <span className="text-red-600 font-semibold">✗ Expirado</span>
                    )}
                    <span className="text-xs text-gray-500">
                      (hasta {formatPublicationDate(announcement.expirationDate)})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================
              CONTENIDO DEL ANUNCIO
              ====================================================== */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Contenido del Comunicado</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {announcement.description || 'Sin contenido'}
              </p>
            </div>
          </div>

          {/* ======================================================
              DOCUMENTOS ADJUNTOS
              ====================================================== */}
          {announcement.attachments && announcement.attachments.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Paperclip className="w-5 h-5 text-[#009DDC]" />
                <h4 className="text-sm font-semibold text-gray-700">
                  Documentos Adjuntos ({announcement.attachments.length})
                </h4>
              </div>
              <div className="space-y-3">
                {announcement.attachments.map((attachment, index) => (
                  <AttachmentLink
                    key={`${announcement.id}-attachment-${index}`}
                    attachment={attachment}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ======================================================
              FOOTER CON ESTADO
              ====================================================== */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}></span>
                {isActive ? 'Comunicado Oficial Vigente' : 'Comunicado Expirado'}
              </span>
              <span>ID: {announcement.id}</span>
            </div>
          </div>

          {/* ======================================================
              BOTÓN CERRAR
              ====================================================== */}
          <div className="pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-gradient-to-r from-[#009DDC] to-[#4DFFF3] hover:shadow-lg transition-all"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementDetailsModal;