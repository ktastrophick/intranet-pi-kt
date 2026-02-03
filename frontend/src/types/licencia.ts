// src/types/licencia.ts

export type EstadoLicencia = 'pendiente' | 'aprobada' | 'rechazada';

export interface LicenciaMedica {
  id: string;
  numero_licencia: string;
  usuario: string;
  usuario_nombre?: string;
  area_nombre?: string;
  fecha_inicio: string; // ISO string
  fecha_termino: string; // ISO string
  dias_totales: number;
  documento_licencia: string; // URL
  estado: EstadoLicencia;
  revisada_por?: string;
  revisada_por_nombre?: string;
  comentarios_revision?: string;
  fecha_revision?: string;
  creado_en: string;
  actualizada_en: string;
  esta_vigente: boolean;
  dias_restantes: number;
}

export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// --- AÑADIR ESTO PARA CORREGIR LOS ERRORES DE IMPORTACIÓN ---

export const STATUS_CONFIG: Record<EstadoLicencia, { label: string; badge: string }> = {
  pendiente: { 
    label: 'Pendiente', 
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200' 
  },
  aprobada: { 
    label: 'Aprobada', 
    badge: 'bg-green-100 text-green-700 border-green-200' 
  },
  rechazada: { 
    label: 'Rechazada', 
    badge: 'bg-red-100 text-red-700 border-red-200' 
  }
};

export const FILE_TYPE_CONFIG: Record<string, { icon: string; bgColor: string }> = {
  pdf: { icon: '📄', bgColor: 'bg-red-50' },
  jpg: { icon: '🖼️', bgColor: 'bg-blue-50' },
  jpeg: { icon: '🖼️', bgColor: 'bg-blue-50' },
  png: { icon: '🖼️', bgColor: 'bg-blue-50' },
  default: { icon: '📎', bgColor: 'bg-gray-50' }
};

// Función auxiliar para obtener extensión
export const getFileExtension = (url?: string | null): string => {
  if (!url) return 'default'; // <--- ESTO EVITA QUE EL SISTEMA EXPLOTE
  const parts = url.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : 'default';
};