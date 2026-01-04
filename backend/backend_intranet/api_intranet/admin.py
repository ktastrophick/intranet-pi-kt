# ======================================================
# ADMIN.PY - Configuración del Admin de Django
# Ubicación: api_intranet/admin.py
# ======================================================

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Usuario, Rol, Area, Solicitud,
    LicenciaMedica, Actividad, InscripcionActividad,
    Anuncio, AdjuntoAnuncio, Documento, CategoriaDocumento,
    Notificacion, LogAuditoria
)


# ======================================================
# USUARIO ADMIN
# ======================================================

@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    list_display = [
        'rut', 'get_nombre_completo', 'email',
        'area', 'rol', 'is_active', 'is_staff'
    ]
    list_filter = ['area', 'rol', 'is_active', 'is_staff', 'es_jefe_de_area']
    search_fields = ['rut', 'nombre', 'apellido_paterno', 'email']
    ordering = ['apellido_paterno', 'apellido_materno', 'nombre']
    
    fieldsets = (
        ('Información Personal', {
            'fields': (
                'rut', 'nombre', 'apellido_paterno', 'apellido_materno',
                'email', 'password', 'telefono', 'fecha_nacimiento', 'direccion'
            )
        }),
        ('Información Profesional', {
            'fields': (
                'cargo', 'area', 'rol', 'fecha_ingreso', 'es_jefe_de_area'
            )
        }),
        ('Contacto de Emergencia', {
            'fields': (
                'contacto_emergencia_nombre',
                'contacto_emergencia_telefono',
                'contacto_emergencia_relacion'
            ),
            'classes': ('collapse',)
        }),
        ('Días Disponibles', {
            'fields': (
                'dias_vacaciones_anuales',
                'dias_vacaciones_disponibles',
                'dias_vacaciones_usados',
                'dias_administrativos_anuales',
                'dias_administrativos_disponibles',
                'dias_administrativos_usados'
            ),
            'classes': ('collapse',)
        }),
        ('Permisos', {
            'fields': (
                'is_active', 'is_staff', 'is_superuser',
                'groups', 'user_permissions'
            ),
            'classes': ('collapse',)
        }),
        ('Preferencias', {
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
                'email', 'password1', 'password2', 'cargo', 'area', 'rol',
                'fecha_ingreso'
            ),
        }),
    )
    
    readonly_fields = ['creado_en', 'actualizado_en', 'ultimo_acceso']
    
    def get_nombre_completo(self, obj):
        return obj.get_nombre_completo()
    get_nombre_completo.short_description = 'Nombre Completo'


# ======================================================
# ROL ADMIN
# ======================================================

@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = [
        'nombre', 'nivel', 'puede_crear_usuarios',
        'puede_eliminar_contenido', 'puede_aprobar_solicitudes'
    ]
    list_filter = ['nivel']
    search_fields = ['nombre']
    ordering = ['-nivel']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'descripcion', 'nivel')
        }),
        ('Permisos', {
            'fields': (
                'puede_crear_usuarios',
                'puede_eliminar_contenido',
                'puede_aprobar_solicitudes',
                'puede_subir_documentos',
                'puede_crear_actividades',
                'puede_crear_anuncios',
                'puede_gestionar_licencias',
                'puede_ver_reportes',
                'puede_editar_calendario'
            )
        })
    )


# ======================================================
# AREA ADMIN
# ======================================================

@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'codigo', 'jefe', 'activa']
    list_filter = ['activa']
    search_fields = ['nombre', 'codigo']
    ordering = ['nombre']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'codigo', 'descripcion')
        }),
        ('Apariencia', {
            'fields': ('color', 'icono')
        }),
        ('Jefatura', {
            'fields': ('jefe',)
        }),
        ('Estado', {
            'fields': ('activa',)
        })
    )


# ======================================================
# SOLICITUD ADMIN
# ======================================================

@admin.register(Solicitud)
class SolicitudAdmin(admin.ModelAdmin):
    list_display = [
        'numero_solicitud', 'usuario', 'tipo',
        'fecha_inicio', 'fecha_termino', 'cantidad_dias',
        'estado', 'fecha_solicitud'
    ]
    list_filter = ['estado', 'tipo', 'fecha_solicitud']
    search_fields = ['numero_solicitud', 'usuario__nombre', 'usuario__rut']
    date_hierarchy = 'fecha_solicitud'
    ordering = ['-fecha_solicitud']
    
    readonly_fields = [
        'numero_solicitud', 'fecha_solicitud',
        'creada_en', 'actualizada_en'
    ]
    
    fieldsets = (
        ('Información de la Solicitud', {
            'fields': (
                'numero_solicitud', 'usuario', 'tipo',
                'fecha_inicio', 'fecha_termino', 'cantidad_dias',
                'motivo', 'telefono_contacto'
            )
        }),
        ('Estado', {
            'fields': ('estado',)
        }),
        ('Aprobación Jefatura', {
            'fields': (
                'aprobada_por_jefatura',
                'jefatura_aprobador',
                'fecha_aprobacion_jefatura',
                'comentarios_jefatura'
            ),
            'classes': ('collapse',)
        }),
        ('Aprobación Dirección', {
            'fields': (
                'aprobada_por_direccion',
                'direccion_aprobador',
                'fecha_aprobacion_direccion',
                'comentarios_direccion'
            ),
            'classes': ('collapse',)
        }),
        ('Documento', {
            'fields': ('pdf_generado', 'url_pdf'),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('fecha_solicitud', 'creada_en', 'actualizada_en'),
            'classes': ('collapse',)
        })
    )


# ======================================================
# LICENCIA MÉDICA ADMIN
# ======================================================

@admin.register(LicenciaMedica)
class LicenciaMedicaAdmin(admin.ModelAdmin):
    # Campos que se ven en la tabla principal
    list_display = [
        'numero_licencia', 
        'usuario', 
        'estado',  # Nuevo: para ver rápido qué está pendiente
        'fecha_inicio', 
        'fecha_termino', 
        'dias_totales',
        'revisada_por', # Nuevo: para saber quién dio el visto bueno
        'creado_en'
    ]
    
    # Filtros laterales: quitamos 'tipo', ponemos 'estado'
    list_filter = ['estado', 'fecha_inicio', 'usuario__area']
    
    # Buscador
    search_fields = ['numero_licencia', 'usuario__nombre', 'usuario__rut']
    
    # Jerarquía por fecha para navegar por años/meses
    date_hierarchy = 'fecha_inicio'
    ordering = ['-creado_en']
    
    # Campos de solo lectura (importante para no corromper cálculos)
    readonly_fields = [
        'dias_totales', # Se calcula solo en el modelo
        'creado_en', 
        'actualizada_en', 
        'fecha_revision'
    ]
    
    # Organización del formulario de edición
    fieldsets = (
        ('Información Básica', {
            'fields': (
                'numero_licencia', 
                'usuario', 
                'documento_licencia'
            )
        }),
        ('Fechas de la Licencia', {
            'fields': (
                ('fecha_inicio', 'fecha_termino'), # En una misma línea
                'dias_totales'
            )
        }),
        ('Estado y Revisión', {
            'fields': (
                'estado', 
                'revisada_por', 
                'comentarios_revision', 
                'fecha_revision'
            ),
            'description': 'Solo personal de Subdirección o Dirección debe modificar estos campos.'
        }),
        ('Metadata de Registro', {
            'fields': ('creado_en', 'actualizada_en'),
            'classes': ('collapse',) # Aparece oculto por defecto
        })
    )

    def save_model(self, request, obj, form, change):
        """
        Opcional: Si un administrador cambia el estado desde el panel de Django,
        registramos automáticamente que él fue quien lo hizo.
        """
        if 'estado' in form.changed_data and obj.estado != 'pendiente':
            obj.revisada_por = request.user
            from django.utils import timezone
            obj.fecha_revision = timezone.now()
        super().save_model(request, obj, form, change)


# ======================================================
# ACTIVIDAD ADMIN
# ======================================================

@admin.register(Actividad)
class ActividadAdmin(admin.ModelAdmin):
    list_display = [
        'titulo', 'tipo', 'fecha_inicio', 'fecha_termino',
        'ubicacion', 'cupo_maximo', 'activa'
    ]
    list_filter = ['tipo', 'para_todas_areas', 'activa', 'fecha_inicio']
    search_fields = ['titulo', 'descripcion']
    date_hierarchy = 'fecha_inicio'
    ordering = ['-fecha_inicio']
    filter_horizontal = ['areas_participantes']
    
    readonly_fields = ['creado_en', 'actualizado_en']
    
    fieldsets = (
        ('Información de la Actividad', {
            'fields': (
                'titulo', 'descripcion', 'tipo',
                'fecha_inicio', 'fecha_termino', 'todo_el_dia'
            )
        }),
        ('Ubicación y Apariencia', {
            'fields': ('ubicacion', 'color', 'imagen')
        }),
        ('Participantes', {
            'fields': (
                'para_todas_areas', 'areas_participantes', 'cupo_maximo'
            )
        }),
        ('Estado', {
            'fields': ('activa',)
        }),
        ('Registro', {
            'fields': ('creado_por', 'creado_en', 'actualizado_en'),
            'classes': ('collapse',)
        })
    )


# ======================================================
# INSCRIPCIÓN ACTIVIDAD ADMIN
# ======================================================

@admin.register(InscripcionActividad)
class InscripcionActividadAdmin(admin.ModelAdmin):
    list_display = ['actividad', 'usuario', 'fecha_inscripcion', 'asistio']
    list_filter = ['asistio', 'fecha_inscripcion']
    search_fields = ['actividad__titulo', 'usuario__nombre']
    date_hierarchy = 'fecha_inscripcion'
    ordering = ['-fecha_inscripcion']


# ======================================================
# ANUNCIO ADMIN
# ======================================================

@admin.register(Anuncio)
class AnuncioAdmin(admin.ModelAdmin):
    list_display = [
        'titulo', 'tipo', 'es_destacado', 'prioridad',
        'fecha_publicacion', 'fecha_expiracion', 'activo'
    ]
    list_filter = ['tipo', 'es_destacado', 'activo', 'fecha_publicacion']
    search_fields = ['titulo', 'contenido']
    date_hierarchy = 'fecha_publicacion'
    ordering = ['-fecha_publicacion', '-prioridad']
    filter_horizontal = ['areas_destinatarias']
    
    readonly_fields = ['creado_en', 'actualizado_en']
    
    fieldsets = (
        ('Información del Anuncio', {
            'fields': (
                'titulo', 'contenido', 'tipo',
                'fecha_publicacion', 'fecha_expiracion'
            )
        }),
        ('Prioridad', {
            'fields': ('es_destacado', 'prioridad')
        }),
        ('Multimedia', {
            'fields': ('imagen',)
        }),
        ('Destinatarios', {
            'fields': ('para_todas_areas', 'areas_destinatarias')
        }),
        ('Estado', {
            'fields': ('activo',)
        }),
        ('Registro', {
            'fields': ('creado_por', 'creado_en', 'actualizado_en'),
            'classes': ('collapse',)
        })
    )


# ======================================================
# ADJUNTO ANUNCIO ADMIN
# ======================================================

@admin.register(AdjuntoAnuncio)
class AdjuntoAnuncioAdmin(admin.ModelAdmin):
    list_display = ['nombre_archivo', 'anuncio', 'tipo_archivo', 'tamano', 'subido_en']
    list_filter = ['tipo_archivo', 'subido_en']
    search_fields = ['nombre_archivo', 'anuncio__titulo']
    date_hierarchy = 'subido_en'
    ordering = ['-subido_en']


# ======================================================
# CATEGORÍA DOCUMENTO ADMIN
# ======================================================

@admin.register(CategoriaDocumento)
class CategoriaDocumentoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'icono', 'orden', 'activa']
    list_filter = ['activa']
    search_fields = ['nombre']
    ordering = ['orden', 'nombre']


# ======================================================
# DOCUMENTO ADMIN
# ======================================================

@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo_documento', 'titulo', 'tipo', 'categoria',
        'version', 'fecha_vigencia', 'descargas', 'activo'
    ]
    list_filter = ['tipo', 'categoria', 'publico', 'activo', 'fecha_vigencia']
    search_fields = ['codigo_documento', 'titulo', 'descripcion']
    date_hierarchy = 'subido_en'
    ordering = ['-subido_en']
    filter_horizontal = ['areas_con_acceso']
    
    readonly_fields = [
        'codigo_documento', 'descargas', 'visualizaciones',
        'subido_en', 'actualizado_en'
    ]
    
    fieldsets = (
        ('Información del Documento', {
            'fields': (
                'codigo_documento', 'titulo', 'descripcion',
                'tipo', 'categoria'
            )
        }),
        ('Archivo', {
            'fields': ('archivo', 'tamano', 'extension')
        }),
        ('Versión y Vigencia', {
            'fields': (
                'version', 'fecha_vigencia', 'fecha_expiracion'
            )
        }),
        ('Acceso', {
            'fields': ('publico', 'areas_con_acceso')
        }),
        ('Estadísticas', {
            'fields': ('descargas', 'visualizaciones'),
            'classes': ('collapse',)
        }),
        ('Estado', {
            'fields': ('activo',)
        }),
        ('Registro', {
            'fields': ('subido_por', 'subido_en', 'actualizado_en'),
            'classes': ('collapse',)
        })
    )


# ======================================================
# NOTIFICACIÓN ADMIN
# ======================================================

@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = [
        'titulo', 'usuario', 'tipo', 'leida',
        'fecha_leida', 'creada_en'
    ]
    list_filter = ['tipo', 'leida', 'creada_en']
    search_fields = ['titulo', 'mensaje', 'usuario__nombre']
    date_hierarchy = 'creada_en'
    ordering = ['-creada_en']
    
    readonly_fields = ['creada_en']
    
    fieldsets = (
        ('Información de la Notificación', {
            'fields': ('usuario', 'tipo', 'titulo', 'mensaje')
        }),
        ('Enlace', {
            'fields': ('url', 'icono')
        }),
        ('Estado', {
            'fields': ('leida', 'fecha_leida')
        }),
        ('Registro', {
            'fields': ('creada_en',),
            'classes': ('collapse',)
        })
    )


# ======================================================
# LOG AUDITORÍA ADMIN
# ======================================================

@admin.register(LogAuditoria)
class LogAuditoriaAdmin(admin.ModelAdmin):
    list_display = [
        'usuario', 'accion', 'modelo', 'objeto_id',
        'ip_address', 'timestamp'
    ]
    list_filter = ['accion', 'modelo', 'timestamp']
    search_fields = ['usuario__nombre', 'descripcion', 'objeto_id']
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    readonly_fields = ['timestamp']
    
    fieldsets = (
        ('Acción', {
            'fields': ('usuario', 'accion', 'modelo', 'objeto_id', 'descripcion')
        }),
        ('Detalles Técnicos', {
            'fields': ('ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
        ('Timestamp', {
            'fields': ('timestamp',)
        })
    )


# ======================================================
# CONFIGURACIÓN DEL ADMIN SITE
# ======================================================

admin.site.site_header = "Administración CESFAM Santa Rosa"
admin.site.site_title = "CESFAM Admin"
admin.site.index_title = "Panel de Administración"