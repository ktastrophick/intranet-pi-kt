// ======================================================
// TIPOS Y INTERFACES - Usuario CESFAM
// Ubicación: src/types/usuario.ts
// Descripción: Interfaces sincronizadas con models.py y serializers.py (Django)
// ======================================================

/**
 * Interface completa del Usuario
 * Refleja el UsuarioDetailSerializer del backend
 */
export interface Usuario {
  // Identificación
  id: string; // UUID
  rut: string; // Formato XX.XXX.XXX-X
  
  // Datos personales
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombre_completo: string; // Generado por el backend
  email: string;
  telefono: string;
  fecha_nacimiento?: string; // ISO Date string
  direccion?: string;
  
  // Información profesional
  cargo: string;
  area: string;         // UUID
  area_nombre: string;  // Desde serializer
  rol: string;          // UUID
  rol_nombre: string;   // Desde serializer
  rol_nivel: number;    // 1: Funcionario, 2: Jefatura, 3: Subdirección, 4: Dirección
  
  tipo_contrato: string;        // UUID
  tipo_contrato_nombre: string; // Desde serializer
  fecha_ingreso: string;        // ISO Date string
  es_jefe_de_area: boolean;
  
  // --- GESTIÓN DE TIEMPOS Y DÍAS (BOLSAS) ---
  dias_vacaciones_disponibles: number;      // Enteros
  dias_administrativos_disponibles: number; // Decimal (permite 0.5)
  dias_sin_goce_acumulados: number;         // Decimal (acumulativo)
  horas_devolucion_disponibles: number;     // Decimal (en horas)

  // --- PERMISOS GRANULARES (Vienen del Rol) ---
  rol_puede_crear_usuarios: boolean;
  rol_puede_eliminar_contenido: boolean;
  rol_puede_aprobar_solicitudes: boolean;
  rol_puede_subir_documentos: boolean;
  rol_puede_crear_actividades: boolean;
  rol_puede_crear_anuncios: boolean;
  rol_puede_gestionar_licencias: boolean;
  rol_puede_ver_reportes: boolean;
  rol_puede_editar_calendario: boolean;
  
  // Avatar y preferencias
  avatar: string | null; // URL de la imagen
  tema_preferido: 'light' | 'dark';
  
  // Estado y Auditoría
  is_active: boolean;
  is_staff: boolean;
  creado_en: string;
  actualizado_en: string;
  ultimo_acceso: string | null;
}

/**
 * DTO para crear un nuevo usuario
 * Coincide con UsuarioCreateSerializer
 */
export interface CrearUsuarioDTO {
  rut: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  email: string;
  password?: string;
  password_confirm?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  direccion?: string;
  cargo: string;
  area: string; // UUID
  rol: string;  // UUID
  tipo_contrato: string; // UUID
  fecha_ingreso: string;
  es_jefe_de_area: boolean;
  
  // Saldos iniciales opcionales
  dias_vacaciones_disponibles?: number;
  dias_administrativos_disponibles?: number;
  horas_devolucion_disponibles?: number;
}

/**
 * DTO para editar usuario
 */
export interface EditarUsuarioDTO extends Partial<CrearUsuarioDTO> {
  id: string;
  is_active?: boolean;
}

/**
 * Interface para Rol (desde backend)
 */
export interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
  nivel: 1 | 2 | 3 | 4;
  // Flags de permisos
  puede_crear_usuarios: boolean;
  puede_eliminar_contenido: boolean;
  puede_aprobar_solicitudes: boolean;
  puede_subir_documentos: boolean;
  puede_crear_actividades: boolean;
  puede_crear_anuncios: boolean;
  puede_gestionar_licencias: boolean;
  puede_ver_reportes: boolean;
  puede_editar_calendario: boolean;
}

/**
 * Interface para Área (desde backend)
 */
export interface Area {
  id: string;
  nombre: string;
  descripcion: string;
  codigo: string;
  color: string;
  icono: string;
  jefe: string | null; // UUID del usuario jefe
  jefe_nombre: string | null;
  total_funcionarios: number;
  activa: boolean;
}

/**
 * Interface para Tipo de Contrato
 */
export interface TipoContrato {
  id: string;
  nombre: string;
  descripcion?: string;
}

// ======================================================
// HELPERS
// ======================================================

/**
 * Helper: Validar RUT chileno (con puntos y guión)
 */
export function validarRUT(rut: string): boolean {
  const regex = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;
  return regex.test(rut);
}

/**
 * Helper: Formatear RUT a formato XX.XXX.XXX-X
 */
export function formatearRUT(rut: string): string {
  let value = rut.replace(/\./g, '').replace('-', '');
  
  if (value.length < 2) return value;
  
  const dv = value.slice(-1);
  let cuerpo = value.slice(0, -1);
  
  cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return cuerpo + '-' + dv;
}

/**
 * Helper: Obtener el label del nivel de rol
 */
export function getLabelNivel(nivel: number): string {
  const niveles: Record<number, string> = {
    1: 'Funcionario',
    2: 'Jefatura',
    3: 'Subdirección',
    4: 'Dirección'
  };
  return niveles[nivel] || 'Desconocido';
}