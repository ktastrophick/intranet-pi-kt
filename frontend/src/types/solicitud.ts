export type TipoSolicitud = 
  | 'vacaciones' 
  | 'dia_administrativo' 
  | 'permiso_sin_goce' 
  | 'devolucion_tiempo' 
  | 'otro_permiso';

export type EstadoSolicitud = 
  | 'pendiente_jefatura'
  | 'pendiente_direccion'
  | 'aprobada'
  | 'rechazada'
  | 'anulada_usuario'
  | 'solicitud_anulacion_licencia'
  | 'anulada_por_licencia';

export interface Solicitud {
  id: string;
  numero_solicitud: string;
  usuario: string; // UUID
  usuario_nombre: string;
  usuario_area: string;
  tipo: TipoSolicitud;
  nombre_otro_permiso?: string; // Nuevo
  fecha_inicio: string;
  fecha_termino: string;
  cantidad_dias: number; // Decimal en backend, number en TS
  es_medio_dia: boolean; // Nuevo
  motivo: string;
  telefono_contacto: string;
  estado: EstadoSolicitud;
  
  // Aprobaciones
  jefatura_aprobador_nombre?: string;
  fecha_aprobacion_jefatura?: string;
  direccion_aprobador_nombre?: string;
  fecha_aprobacion_direccion?: string;
  comentarios_administracion?: string;
  
  pdf_generado: boolean;
  url_pdf: string;
  creada_en: string;
  actualizada_en: string;
}

// Configuración extendida para los badges
export const ESTADO_CONFIG: Record<EstadoSolicitud, { label: string; badge: string }> = {
  pendiente_jefatura: { label: 'Pendiente Jefatura', badge: 'bg-yellow-100 text-yellow-700' },
  pendiente_direccion: { label: 'Pendiente Dirección', badge: 'bg-orange-100 text-orange-700' },
  aprobada: { label: 'Aprobada', badge: 'bg-green-100 text-green-700' },
  rechazada: { label: 'Rechazada', badge: 'bg-red-100 text-red-700' },
  anulada_usuario: { label: 'Anulada por Usuario', badge: 'bg-gray-100 text-gray-700' },
  solicitud_anulacion_licencia: { label: 'Anulación por Licencia', badge: 'bg-purple-100 text-purple-700' },
  anulada_por_licencia: { label: 'Anulada (Licencia)', badge: 'bg-indigo-100 text-indigo-700' },
};