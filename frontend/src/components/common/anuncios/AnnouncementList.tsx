// ======================================================
// COMPONENTE: AnnouncementList (VERSION 2 COLUMNAS)
// Ubicación: src/components/common/anuncios/AnnouncementList.tsx
// Descripción: Lista de anuncios con disposición de 2 columnas
// ======================================================

'use client';

import React, { useState } from 'react';
import type { Announcement } from '@/types/announcement';
import { AnnouncementCard } from './AnnouncementCard';
import { AnnouncementDetailsModal } from './AnnouncementDetailsModal';
import { FileSearch, Loader2 } from 'lucide-react';

// ======================================================
// INTERFACES
// ======================================================

interface AnnouncementListProps {
  announcements: Announcement[];
  isLoading?: boolean;
  isAdminView?: boolean;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcement: Announcement) => void;
}

// ======================================================
// COMPONENTE DE SKELETON (Loading state en 2 columnas)
// ======================================================

const AnnouncementSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border-l-4 border-l-gray-300 shadow-lg overflow-hidden animate-pulse h-full">
    {/* Header skeleton */}
    <div className="bg-gray-100 p-6">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
    
    {/* Content skeleton */}
    <div className="p-6 space-y-3">
      <div className="h-4 bg-gray-200 rounded" />
      <div className="h-4 bg-gray-200 rounded" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
    </div>
  </div>
);

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export const AnnouncementList: React.FC<AnnouncementListProps> = ({
  announcements,
  isLoading = false,
  isAdminView = false,
  onEdit,
  onDelete
}) => {
  // Estado para el modal de detalles
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Manejador para abrir el modal de detalles
  const handleViewDetails = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsModalOpen(true);
  };

  // ======================================================
  // ESTADO DE CARGA
  // ======================================================
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-[#009DDC] animate-spin" />
          <span className="ml-3 text-gray-600 font-medium">
            Cargando comunicados oficiales...
          </span>
        </div>
        {/* Skeletons en grid de 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <AnnouncementSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // ======================================================
  // ESTADO VACÍO
  // ======================================================
  if (!announcements || announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-32 h-32 mb-6 rounded-full bg-gradient-to-br from-blue-100 to-gray-100 flex items-center justify-center">
          <FileSearch className="w-16 h-16 text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          No hay comunicados oficiales
        </h3>
        <p className="text-gray-600 text-center max-w-md mb-6">
          Por el momento no hay comunicados publicados.
        </p>
        <div className="bg-blue-50 border-l-4 border-[#009DDC] p-4 rounded-lg max-w-md">
          <p className="text-sm text-gray-700">
            <strong className="text-[#009DDC]">Nota:</strong> Los comunicados oficiales 
            son el canal único y verificado para información institucional importante.
          </p>
        </div>
      </div>
    );
  }

  // ======================================================
  // RENDERIZADO DE LA LISTA
  // ======================================================
  try {
    return (
      <>
        <div className="space-y-8">
          {/* Contador de comunicados (Ocupa todo el ancho arriba) */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4 border-l-4 border-l-[#009DDC]">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total de Comunicados Oficiales
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {announcements.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#009DDC] to-[#4DFFF3] flex items-center justify-center">
              <span className="text-2xl">📢</span>
            </div>
          </div>

          {/* GRID DE COMUNICADOS: 1 col en móvil, 2 cols en desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {announcements.map((announcement, index) => (
              <div
                key={announcement.id}
                className="animate-fadeIn flex"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Envolvemos la card en un div con 'flex' para que todas tengan el mismo alto si es necesario */}
                <div className="w-full h-full">
                  <AnnouncementCard
                    announcement={announcement}
                    isAdminView={isAdminView}
                    onViewDetails={handleViewDetails}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Mensaje al final de la lista (Ocupa todo el ancho abajo) */}
          <div className="text-center py-6 text-sm text-gray-500 border-t border-gray-100">
            <p>Has visto todos los comunicados oficiales</p>
          </div>
        </div>

        {/* Modal de detalles */}
        <AnnouncementDetailsModal
          announcement={selectedAnnouncement}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      </>
    );
  } catch (error) {
    console.error('Error en AnnouncementList:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-bold text-red-800 mb-2">Error al cargar anuncios</h3>
        <p className="text-red-600">Por favor, revisa la consola del navegador para más detalles.</p>
      </div>
    );
  }
};

export default AnnouncementList;