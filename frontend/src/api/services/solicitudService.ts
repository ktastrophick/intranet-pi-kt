// ======================================================
// SERVICIO: SolicitudService
// Ubicación: frontend/src/api/services/solicitudService.ts
// ======================================================

import axios from '../axios';

// --- TIPOS ---
export type TipoSolicitud = 'vacaciones' | 'dia_administrativo' | 'permiso_sin_goce' | 'devolucion_tiempo' | 'otro_permiso';
export type EstadoSolicitud = 'pendiente_jefatura' | 'pendiente_direccion' | 'aprobada' | 'rechazada' | 'anulada_usuario' | 'solicitud_anulacion_licencia' | 'anulada_por_licencia';

export interface Solicitud {
  id: string;
  numero_solicitud: string;
  usuario: string;
  usuario_nombre: string;
  usuario_area: string;
  usuario_cargo: string;
  tipo: TipoSolicitud;
  tipo_display: string;
  nombre_otro_permiso: string | null;
  fecha_inicio: string;
  fecha_termino: string;
  cantidad_dias: number;
  es_medio_dia: boolean;
  motivo: string;
  telefono_contacto: string;
  estado: EstadoSolicitud;
  estado_display: string;
  jefatura_aprobador_nombre: string | null;
  fecha_aprobacion_jefatura: string | null;
  direccion_aprobador_nombre: string | null;
  fecha_aprobacion_direccion: string | null;
  comentarios_administracion: string;
  pdf_generado: boolean;
  url_pdf: string;
  creada_en: string;
  actualizada_en: string;
}

export interface CrearSolicitudDTO {
  tipo: TipoSolicitud;
  nombre_otro_permiso?: string;
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

// --- CLASE SERVICIO ---
class SolicitudService {
  private readonly baseURL = '/solicitudes';

  async getAll(params?: any): Promise<Solicitud[]> {
    const response = await axios.get(`${this.baseURL}/`, { params });
    return response.data;
  }

  async getMisSolicitudes(): Promise<Solicitud[]> {
    const response = await axios.get(`${this.baseURL}/mis_solicitudes/`);
    return response.data;
  }

  async getById(id: string): Promise<Solicitud> {
    const response = await axios.get(`${this.baseURL}/${id}/`);
    return response.data;
  }

  async create(data: CrearSolicitudDTO): Promise<Solicitud> {
    const response = await axios.post(`${this.baseURL}/`, data);
    return response.data;
  }

  /**
   * ✅ NUEVO: Descarga el PDF como un archivo binario (Blob)
   */
  async descargarPDF(id: string): Promise<Blob> {
    const response = await axios.get(`${this.baseURL}/${id}/descargar_pdf/`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async aprobar(id: string, data: AprobarRechazarDTO, userNivel: number): Promise<any> {
    const endpoint = userNivel >= 3 ? 'aprobar_direccion' : 'aprobar_jefatura';
    const response = await axios.post(`${this.baseURL}/${id}/${endpoint}/`, data);
    return response.data;
  }

  async anularUsuario(id: string): Promise<any> {
    const response = await axios.post(`${this.baseURL}/${id}/anular_usuario/`);
    return response.data;
  }

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
}

export const solicitudService = new SolicitudService();
export default solicitudService;