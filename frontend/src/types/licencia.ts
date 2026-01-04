// src/types/licencia.ts

export type EstadoLicencia = 'pendiente' | 'aprobada' | 'rechazada';

export interface LicenciaMedica {
  id: string;
  numero_licencia: string; // Folio
  usuario: string; // UUID del usuario
  usuario_nombre?: string; // Nombre legible (del serializer)
  area_nombre?: string;    // Área del usuario (del serializer)
  
  fecha_inicio: string;
  fecha_termino: string;
  dias_totales: number;
  
  documento_licencia: string; // URL del archivo
  estado: EstadoLicencia;
  
  revisada_por?: string;
  revisada_por_nombre?: string;
  comentarios_revision?: string;
  fecha_revision?: string;
  
  creado_en: string;
  actualizada_en: string;
  esta_vigente: boolean;
}

// Constantes para validación en el frontend
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB