// ======================================================
// COMPONENTE: AnnouncementCard
// Ubicación: src/components/common/AnnouncementCard.tsx
// Descripción: Tarjeta compacta de comunicado oficial
// ======================================================

'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Announcement } from '@/types/announcement';
import { CATEGORY_CONFIG } from '@/types/announcement';
import { Calendar, Eye, Edit, Trash2 } from 'lucide-react';

// ======================================================
// INTERFACES
// ======================================================

interface AnnouncementCardProps {
  announcement: Announcement;
  isAdminView?: boolean;
  onViewDetails?: (announcement: Announcement) => void;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcement: Announcement) => void;
}

// ======================================================
// FUNCIONES AUXILIARES
// ======================================================

/**
 * Formatea la fecha de publicación de forma corta
 */
const formatPublicationDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('es-ES', options);
};



/**
 * Trunca el texto a un número de caracteres
 */
const truncateText = (text: string | undefined | null, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength) + '...';
};

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  isAdminView = false,
  onViewDetails,
  onEdit,
  onDelete
}) => {
  const categoryConfig = announcement.category 
    ? CATEGORY_CONFIG[announcement.category]
    : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#009DDC]">
      {/* ======================================================
          CABECERA DE LA CARD
          ====================================================== */}
      <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 pb-3">
        <div className="flex items-start justify-between gap-4">
          {/* Título */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 line-clamp-2">
              {announcement.title}
            </h3>
            
            {/* Fecha de publicación */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3.5 h-3.5 text-[#009DDC]" />
              <span>{formatPublicationDate(announcement.publicationDate)}</span>
              <span className="text-gray-400">•</span>
              
            </div>
          </div>

          {/* Badge de categoría */}
          {categoryConfig && (
            <div className={`
              px-2.5 py-1 rounded-full text-xs font-semibold
              border ${categoryConfig.badge}
              flex items-center gap-1 flex-shrink-0
            `}>
              <span>{categoryConfig.icon}</span>
              <span className="hidden sm:inline">{categoryConfig.label}</span>
            </div>
          )}
        </div>
      </CardHeader>

      {/* ======================================================
          CONTENIDO DE LA CARD
          ====================================================== */}
      <CardContent className="pt-4">
        {/* Descripción resumida */}
        <p className="text-sm text-gray-700 leading-relaxed mb-3 line-clamp-3">
          {truncateText(announcement.description, 200)}
        </p>

        {/* Indicador de archivos adjuntos */}
        {announcement.attachments && announcement.attachments.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-blue-600 mb-4 bg-blue-50 rounded-lg px-3 py-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="font-medium">
              {announcement.attachments.length} archivo{announcement.attachments.length > 1 ? 's' : ''} adjunto{announcement.attachments.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2">
          {/* Botón Ver Detalles - Tamaño reducido */}
          <Button
            onClick={() => onViewDetails?.(announcement)}
            className="bg-gradient-to-r from-[#009DDC] to-[#4DFFF3] hover:shadow-lg transition-all"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Detalles
          </Button>

          {/* Botones de Administración - Solo para admins */}
          {isAdminView && (
            <>
              {/* Botón Editar */}
              {onEdit && (
                <Button
                  onClick={() => onEdit(announcement)}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}

              {/* Botón Eliminar */}
              {onDelete && (
                <Button
                  onClick={() => onDelete(announcement)}
                  variant="outline"
                  size="sm"
                  className="border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnouncementCard;