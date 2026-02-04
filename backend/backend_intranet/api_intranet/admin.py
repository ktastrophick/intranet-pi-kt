# ======================================================
# ADMIN.PY - Configuración del Admin de Django
# Ubicación: api_intranet/admin.py
# ======================================================

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Usuario, Rol, Area, TipoContrato, Solicitud,
    LicenciaMedica, Actividad, InscripcionActividad,
    Anuncio, AdjuntoAnuncio, Documento, CategoriaDocumento,
    Notificacion, LogAuditoria
)

# ======================================================
# TIPO DE CONTRATO
# ======================================================

@admin.register(TipoContrato)
class TipoContratoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'descripcion']
    search_fields = ['nombre']

# ======================================================
# USUARIO ADMIN
# ======================================================

@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    list_display = [
        'rut', 'get_nombre_completo', 'email',
        'area', 'rol', 'tipo_contrato', 'is_active'
    ]
    list_filter = ['area', 'rol', 'tipo_contrato', 'is_active', 'es_jefe_de_area']
    search_fields = ['rut', 'nombre', 'apellido_paterno', 'email']
    ordering = ['apellido_paterno', 'apellido_materno', 'nombre']
    
    # Se ajusta para coincidir con los campos reales del modelo
    fieldsets = (
        ('Información Personal', {
            'fields': (
                'rut', 'nombre', 'apellido_paterno', 'apellido_materno',
                'email', 'password', 'telefono', 'fecha_nacimiento', 'direccion'
            )
        }),
        ('Información Profesional', {
            'fields': (
                'cargo', 'area', 'rol', 'tipo_contrato', 'fecha_ingreso', 'es_jefe_de_area'
            )
        }),
        ('Gestión de Tiempos y Días', {
            'fields': (
                'dias_vacaciones_disponibles',
                'dias_administrativos_disponibles',
                'dias_sin_goce_acumulados',
                'horas_devolucion_disponibles'
            ),
            'description': 'Valores actuales de saldos para el funcionario.'
        }),
        ('Permisos de Sistema', {
            'fields': (
                'is_active', 'is_staff', 'is_superuser',
                'groups', 'user_permissions'
            ),
            'classes': ('collapse',)
        }),
        ('Preferencias y Multimedia', {
            'fields': ('avatar', 'tema_preferido'),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('creado_en', 'actualizado_en', 'ultimo_acceso'),
            'classes': ('collapse',)
        })
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'rut', 'nombre', 'apellido_paterno', 'apellido_materno',
                'email', 'password', 'cargo', 'area', 'rol', 'tipo_contrato',
                'fecha_ingreso'
            ),
        }),
    )
    
    readonly_fields = ['creado_en', 'actualizado_en', 'ultimo_acceso']
    
    def get_nombre_completo(self, obj):
        return obj.get_nombre_completo()
    get_nombre_completo.short_description = 'Nombre Completo'


# ======================================================
# SOLICITUD ADMIN
# ======================================================

@admin.register(Solicitud)
class SolicitudAdmin(admin.ModelAdmin):
    list_display = [
        'numero_solicitud', 'usuario', 'tipo',
        'fecha_inicio', 'fecha_termino', 'cantidad_dias',
        'estado', 'creada_en'
    ]
    list_filter = ['estado', 'tipo', 'creada_en']
    search_fields = ['numero_solicitud', 'usuario__nombre', 'usuario__rut']
    date_hierarchy = 'creada_en'
    ordering = ['-creada_en']
    
    readonly_fields = [
        'numero_solicitud',
        'creada_en', 'actualizada_en'
    ]
    
    fieldsets = (
        ('Información de la Solicitud', {
            'fields': (
                'numero_solicitud', 'usuario', 'tipo', 'nombre_otro_permiso',
                ('fecha_inicio', 'fecha_termino'),
                ('cantidad_dias', 'es_medio_dia'),
                'motivo', 'telefono_contacto'
            )
        }),
        ('Estado del Flujo', {
            'fields': ('estado',)
        }),
        ('Aprobaciones', {
            'fields': (
                'jefatura_aprobador', 'fecha_aprobacion_jefatura',
                'direccion_aprobador', 'fecha_aprobacion_direccion',
                'comentarios_administracion'
            ),
            'description': 'Registro de quién y cuándo aprobó la solicitud.'
        }),
        ('Documento PDF', {
            'fields': ('pdf_generado', 'url_pdf'),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('creada_en', 'actualizada_en'),
            'classes': ('collapse',)
        })
    )


# ======================================================
# ANUNCIO ADMIN
# ======================================================

@admin.register(Anuncio)
class AnuncioAdmin(admin.ModelAdmin):
    list_display = [
        'titulo', 'tipo', 'visibilidad_roles', 'es_destacado', 
        'fecha_publicacion', 'activo'
    ]
    list_filter = ['tipo', 'visibilidad_roles', 'es_destacado', 'activo']
    search_fields = ['titulo', 'contenido']
    filter_horizontal = ['areas_destinatarias']
    
    fieldsets = (
        ('Contenido', {
            'fields': ('titulo', 'contenido', 'tipo', 'imagen')
        }),
        ('Configuración de Publicación', {
            'fields': (
                'fecha_publicacion', 'fecha_expiracion', 
                'es_destacado', 'prioridad', 'activo'
            )
        }),
        ('Audiencia / Visibilidad', {
            'fields': ('para_todas_areas', 'areas_destinatarias', 'visibilidad_roles'),
            'description': 'Controla quién puede ver este comunicado.'
        }),
        ('Registro', {
            'fields': ('creado_por', 'creado_en', 'actualizado_en'),
            'classes': ('collapse',)
        })
    )
    readonly_fields = ['creado_en', 'actualizado_en']


# ======================================================
# DOCUMENTO ADMIN
# ======================================================

@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo_documento', 'titulo', 'tipo', 'categoria',
        'storage_type', 'version', 'fecha_vigencia', 'activo'
    ]
    list_filter = ['tipo', 'categoria', 'storage_type', 'activo']
    search_fields = ['codigo_documento', 'titulo', 'nombre_archivo']
    filter_horizontal = ['areas_con_acceso']
    
    readonly_fields = [
        'codigo_documento', 'descargas', 'visualizaciones',
        'subido_en', 'actualizado_en', 'tamano', 'extension', 'mime_type'
    ]
    
    fieldsets = (
        ('Identificación', {
            'fields': ('codigo_documento', 'titulo', 'descripcion', 'tipo', 'categoria')
        }),
        ('Archivo y Almacenamiento', {
            'fields': (
                'storage_type', 'archivo_url', 'nombre_archivo', 
                'tipo_archivo', 'mime_type', 'tamano', 'extension'
            ),
            'description': 'El contenido binario no es editable desde aquí.'
        }),
        ('Vigencia y Control', {
            'fields': ('version', 'fecha_vigencia', 'fecha_expiracion', 'activo')
        }),
        ('Permisos de Acceso', {
            'fields': ('publico', 'areas_con_acceso')
        }),
        ('Estadísticas y Registro', {
            'fields': (
                'descargas', 'visualizaciones', 'subido_por', 
                'subido_en', 'actualizado_en'
            ),
            'classes': ('collapse',)
        })
    )


# ======================================================
# LICENCIA MÉDICA ADMIN
# ======================================================

@admin.register(LicenciaMedica)
class LicenciaMedicaAdmin(admin.ModelAdmin):
    list_display = [
        'numero_licencia', 'usuario', 'estado', 
        'fecha_inicio', 'fecha_termino', 'dias_totales'
    ]
    list_filter = ['estado', 'fecha_inicio']
    search_fields = ['numero_licencia', 'usuario__nombre', 'usuario__rut']
    readonly_fields = ['dias_totales', 'creado_en', 'actualizada_en', 'fecha_revision']
    
    fieldsets = (
        ('Información de la Licencia', {
            'fields': ('numero_licencia', 'usuario', 'documento_licencia')
        }),
        ('Fechas', {
            'fields': (('fecha_inicio', 'fecha_termino'), 'dias_totales')
        }),
        ('Revisión y Auditoría', {
            'fields': ('estado', 'revisada_por', 'comentarios_revision', 'fecha_revision')
        }),
        ('Metadata', {
            'fields': ('creado_en', 'actualizada_en'),
            'classes': ('collapse',)
        })
    )

    def save_model(self, request, obj, form, change):
        if 'estado' in form.changed_data and obj.estado != 'pendiente':
            obj.revisada_por = request.user
            from django.utils import timezone
            obj.fecha_revision = timezone.now()
        super().save_model(request, obj, form, change)


# ======================================================
# OTROS MODELOS (CONFIGURACIÓN ESTÁNDAR)
# ======================================================

@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'nivel', 'puede_aprobar_solicitudes', 'puede_gestionar_licencias']
    list_filter = ['nivel']

@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'codigo', 'jefe', 'activa']
    search_fields = ['nombre', 'codigo']

@admin.register(Actividad)
class ActividadAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'tipo', 'fecha_inicio', 'activa']
    filter_horizontal = ['areas_participantes']

@admin.register(InscripcionActividad)
class InscripcionActividadAdmin(admin.ModelAdmin):
    list_display = ['actividad', 'usuario', 'fecha_inscripcion', 'asistio']

@admin.register(AdjuntoAnuncio)
class AdjuntoAnuncioAdmin(admin.ModelAdmin):
    list_display = ['nombre_archivo', 'anuncio', 'tipo_archivo']

@admin.register(CategoriaDocumento)
class CategoriaDocumentoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'orden', 'activa']

@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'usuario', 'tipo', 'leida', 'creada_en']
    list_filter = ['tipo', 'leida']

@admin.register(LogAuditoria)
class LogAuditoriaAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'accion', 'modelo', 'timestamp', 'ip_address']
    readonly_fields = ['timestamp']

# Configuración Global del Panel
admin.site.site_header = "Administración CESFAM Santa Rosa"
admin.site.site_title = "CESFAM Admin"
admin.site.index_title = "Panel de Control Intranet"