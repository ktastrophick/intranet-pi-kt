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
  usuario_cargo: string; // Asegúrate que el Serializer de Django envíe esto
  
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
  
  // Estado y Aprobaciones (Nombres sincronizados con Django models.py)
  estado: EstadoSolicitud;
  estado_display: string;
  
  jefatura_aprobador_nombre: string | null;
  fecha_aprobacion_jefatura: string | null; // Sincronizado con backend
  
  direccion_aprobador_nombre: string | null;
  fecha_aprobacion_direccion: string | null; // Sincronizado con backend
  
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
   * Métodos para el panel de administración (AprobacionesAdminPage)
   * Nota: El filtrado por área ya lo hace el backend en get_queryset
   */
  async getPendientes(): Promise<Solicitud[]> {
    // Obtenemos las solicitudes. El backend filtrará automáticamente
    // según el nivel del usuario logueado.
    return this.getAll();
  }

  async getMisAprobaciones(): Promise<Solicitud[]> {
    // Filtrar las que ya están aprobadas o rechazadas por el usuario actual
    return this.getAll({ estado: 'aprobada' });
  }

  async getHistorialCompleto(): Promise<Solicitud[]> {
    return this.getAll();
  }

  /**
   * Obtener detalle de una solicitud
   */
  async getById(id: string): Promise<Solicitud> {
    const response = await axios.get(`${this.baseURL}/${id}/`);
    return response.data;
  }

  /**
   * Crear nueva solicitud
   */
  async create(data: CrearSolicitudDTO): Promise<Solicitud> {
    const response = await axios.post(`${this.baseURL}/`, data);
    return response.data;
  }

  /**
   * Aprobación por parte de Jefatura (Nivel 2)
   */
  async aprobarJefatura(id: string, data: AprobarRechazarDTO): Promise<any> {
    const response = await axios.post(`${this.baseURL}/${id}/aprobar_jefatura/`, data);
    return response.data;
  }

  /**
   * Aprobación por parte de Dirección o Subdirección (Nivel 3 y 4)
   */
  async aprobarDireccion(id: string, data: AprobarRechazarDTO): Promise<any> {
    const response = await axios.post(`${this.baseURL}/${id}/aprobar_direccion/`, data);
    return response.data;
  }

  /**
   * Método polimórfico para aprobar según el nivel del usuario
   * @param userNivel Debe ser el nivel numérico (1, 2, 3, 4)
   */
  async aprobar(id: string, data: AprobarRechazarDTO, userNivel: number): Promise<any> {
    if (userNivel >= 3) {
      return this.aprobarDireccion(id, data);
    }
    return this.aprobarJefatura(id, data);
  }

  /**
   * Rechazar una solicitud (es una aprobación con valor false)
   */
  async rechazar(id: string, data: { comentarios: string }, userNivel: number): Promise<any> {
    return this.aprobar(id, { aprobar: false, ...data }, userNivel);
  }

  /**
   * El usuario anula su propia solicitud
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
   * Dirección confirma la anulación por licencia
   */
  async finalizarAnulacionLicencia(id: string): Promise<any> {
    const response = await axios.post(`${this.baseURL}/${id}/finalizar_anulacion_licencia/`);
    return response.data;
  }

  /**
   * Helper: Calcular días hábiles
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

  getPDFUrl(id: string): string {
    return `${axios.defaults.baseURL}${this.baseURL}/${id}/descargar_pdf/`;
  }
}

export const solicitudService = new SolicitudService();
export default solicitudService;