// ======================================================
// SERVICIO: SolicitudService
// Ubicación: frontend/src/api/services/solicitudService.ts
// Descripción: Gestión de solicitudes de vacaciones, días administrativos y nuevos permisos
// ======================================================

import axios from '../axios';

// ======================================================
// TIPOS SINCRONIZADOS CON BACKEND
// ======================================================

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
  numero_solicitud: string; // Ej: SOL-2024-0001
  
  // Relaciones y datos del usuario
  usuario: string; // UUID
  usuario_nombre: string;
  usuario_area: string;
  
  // Información de la solicitud
  tipo: TipoSolicitud;
  tipo_display: string; // "Vacaciones", "Día Administrativo", etc.
  nombre_otro_permiso: string | null;
  
  fecha_inicio: string;      // YYYY-MM-DD
  fecha_termino: string;     // YYYY-MM-DD
  cantidad_dias: number;     // En devolución de tiempo representa Horas
  es_medio_dia: boolean;
  
  motivo: string;
  telefono_contacto: string;
  
  // Estado y Aprobaciones
  estado: EstadoSolicitud;
  estado_display: string;
  
  jefatura_aprobador_nombre: string | null;
  fecha_aprobacion_jefatura: string | null;
  
  direccion_aprobador_nombre: string | null;
  fecha_aprobacion_direccion: string | null;
  
  comentarios_administracion: string;
  
  // Adjuntos/PDF
  pdf_generado: boolean;
  url_pdf: string;
  
  // Auditoría
  creada_en: string;
  actualizada_en: string;
}

export interface CrearSolicitudDTO {
  tipo: TipoSolicitud;
  nombre_otro_permiso?: string;  // Obligatorio si tipo es 'otro_permiso'
  fecha_inicio: string;
  fecha_termino: string;
  cantidad_dias: number;
  es_medio_dia: boolean;
  motivo: string;
  telefono_contacto: string;
}

export interface AprobarRechazarDTO {
  aprobar: boolean;
  comentarios?: string;
}

// ======================================================
// CLASE SERVICIO
// ======================================================

class SolicitudService {
  private readonly baseURL = '/solicitudes';

  /**
   * Obtener todas las solicitudes con filtros
   */
  async getAll(params?: any): Promise<Solicitud[]> {
    const response = await axios.get(`${this.baseURL}/`, { params });
    return response.data;
  }

  /**
   * Obtener detalle de una solicitud
   */
  async getById(id: string): Promise<Solicitud> {
    const response = await axios.get(`${this.baseURL}/${id}/`);
    return response.data;
  }

  /**
   * Crear nueva solicitud (Vacaciones, Administrativos, Sin Goce, Devolución u Otros)
   */
  async create(data: CrearSolicitudDTO): Promise<Solicitud> {
    const response = await axios.post(`${this.baseURL}/`, data);
    return response.data;
  }

  /**
   * Aprobación/Rechazo por parte de Jefatura (Nivel 2)
   */
  async aprobarJefatura(id: string, data: AprobarRechazarDTO): Promise<any> {
    const response = await axios.post(`${this.baseURL}/${id}/aprobar_jefatura/`, data);
    return response.data;
  }

  /**
   * Aprobación/Rechazo por parte de Dirección o Subdirección (Nivel 3 y 4)
   */
  async aprobarDireccion(id: string, data: AprobarRechazarDTO): Promise<any> {
    const response = await axios.post(`${this.baseURL}/${id}/aprobar_direccion/`, data);
    return response.data;
  }

  /**
   * Método polimórfico para aprobar según el rol del usuario
   */
  async aprobar(id: string, data: AprobarRechazarDTO, userNivel: number): Promise<any> {
    if (userNivel >= 3) {
      return this.aprobarDireccion(id, data);
    }
    return this.aprobarJefatura(id, data);
  }

  /**
   * El usuario anula su propia solicitud (solo si está pendiente)
   */
  async anularUsuario(id: string): Promise<any> {
    const response = await axios.post(`${this.baseURL}/${id}/anular_usuario/`);
    return response.data;
  }

  /**
   * El usuario solicita anular una solicitud ya aprobada debido a una Licencia Médica
   */
  async solicitarAnulacionLicencia(id: string): Promise<any> {
    const response = await axios.post(`${this.baseURL}/${id}/solicitar_anulacion_licencia/`);
    return response.data;
  }

  /**
   * Dirección confirma la anulación por licencia (Nivel >= 3)
   */
  async finalizarAnulacionLicencia(id: string): Promise<any> {
    const response = await axios.post(`${this.baseURL}/${id}/finalizar_anulacion_licencia/`);
    return response.data;
  }

  /**
   * Helper: Calcular días hábiles (Lunes-Viernes)
   */
  calcularDiasHabiles(fechaInicio: string, fechaFin: string): number {
    if (!fechaInicio || !fechaFin) return 0;
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (inicio > fin) return 0;

    let count = 0;
    const current = new Date(inicio);
    while (current <= fin) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  /**
   * Obtener URL para visualización/descarga de PDF
   */
  getPDFUrl(id: string): string {
    return `${axios.defaults.baseURL}${this.baseURL}/${id}/descargar_pdf/`;
  }
}

// ======================================================
// EXPORT
// ======================================================

export const solicitudService = new SolicitudService();
export default solicitudService;