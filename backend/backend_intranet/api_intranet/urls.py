# ======================================================
# URLS.PY - Rutas de la API
# Ubicación: api_intranet/urls.py
# ======================================================

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UsuarioViewSet, RolViewSet, AreaViewSet,
    SolicitudViewSet, LicenciaMedicaViewSet,
    ActividadViewSet, AnuncioViewSet,
    DocumentoViewSet, CategoriaDocumentoViewSet,
    NotificacionViewSet, LogAuditoriaViewSet,
    TipoContratoViewSet
)

# ======================================================
# ROUTER DE LA API
# ======================================================

router = DefaultRouter()

# Registrar ViewSets
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'roles', RolViewSet, basename='rol')
router.register(r'areas', AreaViewSet, basename='area')
router.register(r'tipos-contrato', TipoContratoViewSet, basename='tipo-contrato')
router.register(r'solicitudes', SolicitudViewSet, basename='solicitud')
router.register(r'licencias', LicenciaMedicaViewSet, basename='licencia')
router.register(r'actividades', ActividadViewSet, basename='actividad')
router.register(r'anuncios', AnuncioViewSet, basename='anuncio')
router.register(r'documentos', DocumentoViewSet, basename='documento')
router.register(r'categorias-documento', CategoriaDocumentoViewSet, basename='categoria-documento')
router.register(r'notificaciones', NotificacionViewSet, basename='notificacion')
router.register(r'logs', LogAuditoriaViewSet, basename='log')

# ======================================================
# URL PATTERNS
# ======================================================

urlpatterns = [
    # Incluir todas las rutas del router
    path('', include(router.urls)),
]

# ======================================================
# RUTAS DISPONIBLES
# ======================================================

"""
USUARIOS:
  GET    /api/usuarios/                       - Listar usuarios
  POST   /api/usuarios/                       - Crear usuario
  GET    /api/usuarios/{id}/                  - Detalle de usuario
  PUT    /api/usuarios/{id}/                  - Actualizar usuario
  PATCH  /api/usuarios/{id}/                  - Actualizar parcial
  DELETE /api/usuarios/{id}/                  - Eliminar usuario
  GET    /api/usuarios/me/                    - Usuario actual
  GET    /api/usuarios/{id}/dias_disponibles/ - Días disponibles
  POST   /api/usuarios/{id}/actualizar_dias/  - Recalcular días

ROLES:
  GET    /api/roles/                          - Listar roles
  POST   /api/roles/                          - Crear rol
  GET    /api/roles/{id}/                     - Detalle de rol
  PUT    /api/roles/{id}/                     - Actualizar rol
  DELETE /api/roles/{id}/                     - Eliminar rol

ÁREAS:
  GET    /api/areas/                          - Listar áreas
  POST   /api/areas/                          - Crear área
  GET    /api/areas/{id}/                     - Detalle de área
  PUT    /api/areas/{id}/                     - Actualizar área
  DELETE /api/areas/{id}/                     - Eliminar área
  GET    /api/areas/{id}/funcionarios/        - Funcionarios del área

SOLICITUDES:
  GET    /api/solicitudes/                    - Listar solicitudes
  POST   /api/solicitudes/                    - Crear solicitud
  GET    /api/solicitudes/{id}/               - Detalle de solicitud
  PUT    /api/solicitudes/{id}/               - Actualizar solicitud
  DELETE /api/solicitudes/{id}/               - Eliminar solicitud
  POST   /api/solicitudes/{id}/aprobar_jefatura/    - Aprobar como jefatura
  POST   /api/solicitudes/{id}/aprobar_direccion/   - Aprobar como dirección
  GET    /api/solicitudes/pendientes/         - Solicitudes pendientes
  GET    /api/solicitudes/mis_solicitudes/    - Mis solicitudes

LICENCIAS:
  GET    /api/licencias/                      - Listar licencias
  POST   /api/licencias/                      - Crear licencia
  GET    /api/licencias/{id}/                 - Detalle de licencia
  PUT    /api/licencias/{id}/                 - Actualizar licencia
  DELETE /api/licencias/{id}/                 - Eliminar licencia
  GET    /api/licencias/vigentes/             - Licencias vigentes

ACTIVIDADES:
  GET    /api/actividades/                    - Listar actividades
  POST   /api/actividades/                    - Crear actividad
  GET    /api/actividades/{id}/               - Detalle de actividad
  PUT    /api/actividades/{id}/               - Actualizar actividad
  DELETE /api/actividades/{id}/               - Eliminar actividad
  POST   /api/actividades/{id}/inscribirse/   - Inscribirse
  DELETE /api/actividades/{id}/desinscribirse/ - Desinscribirse

ANUNCIOS:
  GET    /api/anuncios/                       - Listar anuncios
  POST   /api/anuncios/                       - Crear anuncio
  GET    /api/anuncios/{id}/                  - Detalle de anuncio
  PUT    /api/anuncios/{id}/                  - Actualizar anuncio
  DELETE /api/anuncios/{id}/                  - Eliminar anuncio
  GET    /api/anuncios/vigentes/              - Anuncios vigentes

DOCUMENTOS:
  GET    /api/documentos/                     - Listar documentos
  POST   /api/documentos/                     - Crear documento
  GET    /api/documentos/{id}/                - Detalle de documento
  PUT    /api/documentos/{id}/                - Actualizar documento
  DELETE /api/documentos/{id}/                - Eliminar documento
  POST   /api/documentos/{id}/descargar/      - Registrar descarga
  POST   /api/documentos/{id}/visualizar/     - Registrar visualización

CATEGORÍAS DOCUMENTO:
  GET    /api/categorias-documento/           - Listar categorías
  POST   /api/categorias-documento/           - Crear categoría
  GET    /api/categorias-documento/{id}/      - Detalle de categoría
  PUT    /api/categorias-documento/{id}/      - Actualizar categoría
  DELETE /api/categorias-documento/{id}/      - Eliminar categoría

NOTIFICACIONES:
  GET    /api/notificaciones/                 - Listar notificaciones
  POST   /api/notificaciones/                 - Crear notificación
  GET    /api/notificaciones/{id}/            - Detalle de notificación
  POST   /api/notificaciones/{id}/marcar_leida/ - Marcar como leída
  POST   /api/notificaciones/marcar_todas_leidas/ - Marcar todas como leídas
  GET    /api/notificaciones/no_leidas/       - Notificaciones no leídas

LOGS:
  GET    /api/logs/                           - Listar logs (solo lectura)
  GET    /api/logs/{id}/                      - Detalle de log

FILTROS Y BÚSQUEDA:
  - Agregar ?search=texto para buscar
  - Agregar ?ordering=campo para ordenar
  - Agregar ?campo=valor para filtrar
  
Ejemplos:
  /api/usuarios/?area=1&is_active=true
  /api/solicitudes/?estado=pendiente_jefatura
  /api/documentos/?tipo=circular&categoria=1
  /api/notificaciones/?leida=false
"""