// Ubicación: frontend/src/api/index.ts

// Servicios de autenticación
export { authService } from './services/authService';

// Servicios de usuarios y organización
export { usuarioService } from './services/usuarioService';
export { rolService } from './services/rolService';
export { areaService } from './services/areaService';
export { tipoContratoService } from './services/tipoContratoService'; // Asegúrate que esté aquí

// Servicios de solicitudes
export { solicitudService } from './services/solicitudService';

// Re-exportar tipos (Usando 'export type' para evitar errores de VerbatimModuleSyntax)
export type { Usuario, CrearUsuarioDTO, ActualizarUsuarioDTO } from './services/usuarioService';
export type { Rol, CrearRolDTO } from './services/rolService';
export type { Area, CrearAreaDTO } from './services/areaService';
export type { TipoContrato } from '@/types/usuario'; 
export type { 
  Solicitud, 
  CrearSolicitudDTO, 
  TipoSolicitud, 
  EstadoSolicitud,
  AprobarRechazarDTO // ✅ Agregado este que sí existe
  // ❌ Eliminado EstadisticasSolicitudes porque no está definido en el servicio
} from './services/solicitudService';