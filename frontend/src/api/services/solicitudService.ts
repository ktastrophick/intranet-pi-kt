// frontend/src/api/services/solicitudService.ts

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

  async getPendientes(): Promise<Solicitud[]> {
    return this.getAll();
  }

  async getMisAprobaciones(): Promise<Solicitud[]> {
    return this.getAll();
  }

  async getHistorialCompleto(): Promise<Solicitud[]> {
    return this.getAll();
  }

  async getById(id: string): Promise<Solicitud> {
    const response = await axios.get(`${this.baseURL}/${id}/`);
    return response.data;
  }

  async create(data: CrearSolicitudDTO): Promise<Solicitud> {
    const response = await axios.post(`${this.baseURL}/`, data);
    return response.data;
  }

  async descargarPDF(id: string): Promise<Blob> {
    const response = await axios.get(`${this.baseURL}/${id}/descargar_pdf/`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async aprobar(id: string, data: AprobarRechazarDTO, userNivel?: number): Promise<any> {
    const nivel = userNivel ?? 1;
    const endpoint = nivel >= 3 ? 'aprobar_direccion' : 'aprobar_jefatura';
    const response = await axios.post(`${this.baseURL}/${id}/${endpoint}/`, data);
    return response.data;
  }

  async rechazar(id: string, data: { comentarios: string }, userNivel?: number): Promise<any> {
    return this.aprobar(id, { aprobar: false, comentarios: data.comentarios }, userNivel);
  }

  async anularUsuario(id: string): Promise<any> {
    const response = await axios.post(`${this.baseURL}/${id}/anular_usuario/`);
    return response.data;
  }

  /**
   * ✅ MÉTODO PARA CALCULAR DÍAS HÁBILES (Lunes a Viernes)
   */
  calcularDiasHabiles(fechaInicio: string, fechaFin: string): number {
    if (!fechaInicio || !fechaFin) return 0;
    
    // Usamos el formato ISO con T00:00:00 para evitar problemas de zona horaria
    const inicio = new Date(fechaInicio + 'T00:00:00');
    const fin = new Date(fechaFin + 'T00:00:00');
    
    if (inicio > fin) return 0;
    
    let contador = 0;
    const actual = new Date(inicio);
    
    while (actual <= fin) {
      const diaSemana = actual.getDay();
      // 0 = Domingo, 6 = Sábado. Solo sumamos si es 1, 2, 3, 4 o 5.
      if (diaSemana !== 0 && diaSemana !== 6) {
        contador++;
      }
      actual.setDate(actual.getDate() + 1);
    }
    
    return contador;
  }
}

export const solicitudService = new SolicitudService();
export default solicitudService;