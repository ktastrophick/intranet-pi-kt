# ======================================================
# SERIALIZERS.PY - Django REST Framework Serializers
# Ubicación: api_intranet/serializers.py
# ACTUALIZADO: Con campos de permisos del rol
# ======================================================

from rest_framework import serializers
from .models import (
    Usuario, Rol, Area, Solicitud,
    LicenciaMedica, Actividad, InscripcionActividad,
    Anuncio, AdjuntoAnuncio, Documento, CategoriaDocumento,
    Notificacion, LogAuditoria
)


# ======================================================
# SERIALIZERS SIMPLES (Sin relaciones complejas)
# ======================================================

class RolSerializer(serializers.ModelSerializer):
    """Serializer para Rol"""
    class Meta:
        model = Rol
        fields = '__all__'
        read_only_fields = ('id', 'creado_en', 'actualizado_en')


class AreaSerializer(serializers.ModelSerializer):
    """Serializer para Área con jefe"""
    jefe_nombre = serializers.SerializerMethodField()
    total_funcionarios = serializers.SerializerMethodField()
    
    class Meta:
        model = Area
        fields = [
            'id', 'nombre', 'codigo', 'descripcion', 'color', 'icono',
            'jefe', 'jefe_nombre', 'total_funcionarios', 'activa',
            'creada_en', 'actualizada_en'
        ]
        read_only_fields = ('id', 'creada_en', 'actualizada_en')
    
    def get_jefe_nombre(self, obj):
        return obj.jefe.get_nombre_completo() if obj.jefe else None
    
    def get_total_funcionarios(self, obj):
        return obj.funcionarios.count()


class CategoriaDocumentoSerializer(serializers.ModelSerializer):
    """Serializer para Categoría de Documento"""
    class Meta:
        model = CategoriaDocumento
        fields = '__all__'


# ======================================================
# USUARIO SERIALIZERS
# ======================================================

class UsuarioListSerializer(serializers.ModelSerializer):
    """Serializer reducido para listados"""
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)
    rol_nivel = serializers.IntegerField(source='rol.nivel', read_only=True)
    area_nombre = serializers.CharField(source='area.nombre', read_only=True)
    nombre_completo = serializers.SerializerMethodField()
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'rut', 'nombre', 'apellido_paterno', 'apellido_materno', 
            'nombre_completo', 'email', 'telefono',
            'cargo', 'area', 'area_nombre', 'rol', 'rol_nombre', 'rol_nivel',
            'avatar', 'is_active'
        ]
        read_only_fields = ('id',)
    
    def get_nombre_completo(self, obj):
        return obj.get_nombre_completo()


class UsuarioDetailSerializer(serializers.ModelSerializer):
    """Serializer completo del usuario con todos los campos"""
    
    # Campos anidados de solo lectura
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)
    area_nombre = serializers.CharField(source='area.nombre', read_only=True)
    nombre_completo = serializers.CharField(source='get_nombre_completo', read_only=True)
    
    # ✅ CAMPOS DEL ROL PARA PERMISOS
    rol_nivel = serializers.IntegerField(source='rol.nivel', read_only=True)
    rol_puede_crear_usuarios = serializers.BooleanField(source='rol.puede_crear_usuarios', read_only=True)
    rol_puede_eliminar_contenido = serializers.BooleanField(source='rol.puede_eliminar_contenido', read_only=True)
    rol_puede_aprobar_solicitudes = serializers.BooleanField(source='rol.puede_aprobar_solicitudes', read_only=True)
    rol_puede_subir_documentos = serializers.BooleanField(source='rol.puede_subir_documentos', read_only=True)
    rol_puede_crear_actividades = serializers.BooleanField(source='rol.puede_crear_actividades', read_only=True)
    rol_puede_crear_anuncios = serializers.BooleanField(source='rol.puede_crear_anuncios', read_only=True)
    rol_puede_gestionar_licencias = serializers.BooleanField(source='rol.puede_gestionar_licencias', read_only=True)
    rol_puede_ver_reportes = serializers.BooleanField(source='rol.puede_ver_reportes', read_only=True)
    rol_puede_editar_calendario = serializers.BooleanField(source='rol.puede_editar_calendario', read_only=True)
    
    class Meta:
        model = Usuario
        fields = [
            # Identificación
            'id', 'rut',
            
            # Datos personales
            'nombre', 'apellido_paterno', 'apellido_materno', 'nombre_completo',
            'email', 'telefono', 'fecha_nacimiento', 'direccion',
            
            # Información profesional
            'cargo', 'area', 'area_nombre', 'rol', 'rol_nombre', 'fecha_ingreso',
            'es_jefe_de_area',
            
            # Contacto de emergencia
            'contacto_emergencia_nombre',
            'contacto_emergencia_telefono',
            'contacto_emergencia_relacion',
            
            # Días disponibles
            'dias_vacaciones_anuales',
            'dias_vacaciones_disponibles',
            'dias_vacaciones_usados',
            'dias_administrativos_anuales',
            'dias_administrativos_disponibles',
            'dias_administrativos_usados',
            
            # Avatar y preferencias
            'avatar', 'tema_preferido',
            
            # Estado
            'is_active',
            
            # Auditoría
            'creado_en', 'actualizado_en', 'ultimo_acceso',
            
            # ✅ PERMISOS DEL ROL
            'rol_nivel',
            'rol_puede_crear_usuarios',
            'rol_puede_eliminar_contenido',
            'rol_puede_aprobar_solicitudes',
            'rol_puede_subir_documentos',
            'rol_puede_crear_actividades',
            'rol_puede_crear_anuncios',
            'rol_puede_gestionar_licencias',
            'rol_puede_ver_reportes',
            'rol_puede_editar_calendario',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']



class UsuarioCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear usuario"""
    password = serializers.CharField(write_only=True, required=True)
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = Usuario
        fields = [
            'rut', 'nombre', 'apellido_paterno', 'apellido_materno',
            'email', 'password', 'password_confirm', 'telefono',
            'fecha_nacimiento', 'direccion', 'cargo', 'area', 'rol',
            'fecha_ingreso', 'es_jefe_de_area',
            'dias_vacaciones_anuales', 'dias_administrativos_anuales'
        ]
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = Usuario.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ======================================================
# SOLICITUD SERIALIZERS
# ======================================================

class SolicitudListSerializer(serializers.ModelSerializer):
    """Serializer para listado de solicitudes"""
    usuario_nombre = serializers.CharField(source='usuario.get_nombre_completo', read_only=True)
    usuario_email = serializers.EmailField(source='usuario.email', read_only=True)
    usuario_cargo = serializers.CharField(source='usuario.cargo', read_only=True)
    usuario_area = serializers.CharField(source='usuario.area.nombre', read_only=True)
    area_nombre = serializers.CharField(source='usuario.area.nombre', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    # Campos calculados para aprobador (retrocompatibilidad)
    aprobador = serializers.SerializerMethodField()
    aprobador_nombre = serializers.SerializerMethodField()
    fecha_aprobacion = serializers.SerializerMethodField()
    comentario_aprobacion = serializers.SerializerMethodField()
    
    # Campos separados para jefatura
    jefatura_aprobador_nombre = serializers.SerializerMethodField()
    jefatura_fecha_aprobacion = serializers.SerializerMethodField()
    jefatura_comentarios = serializers.SerializerMethodField()
    
    # Campos separados para dirección
    direccion_aprobador_nombre = serializers.SerializerMethodField()
    direccion_fecha_aprobacion = serializers.SerializerMethodField()
    direccion_comentarios = serializers.SerializerMethodField()
    
    class Meta:
        model = Solicitud
        fields = [
            'id', 'numero_solicitud', 'usuario', 'usuario_nombre', 'usuario_email',
            'usuario_cargo', 'usuario_area', 'area_nombre', 'tipo', 'tipo_display', 
            'fecha_inicio', 'fecha_termino', 'cantidad_dias', 'motivo', 
            'telefono_contacto', 'estado', 'estado_display', 'fecha_solicitud',
            'pdf_generado', 'url_pdf', 'creada_en', 'actualizada_en',
            'aprobador', 'aprobador_nombre', 'fecha_aprobacion', 'comentario_aprobacion',
            'jefatura_aprobador_nombre', 'jefatura_fecha_aprobacion', 'jefatura_comentarios',
            'direccion_aprobador_nombre', 'direccion_fecha_aprobacion', 'direccion_comentarios'
        ]
        read_only_fields = ('id', 'numero_solicitud', 'fecha_solicitud', 'creada_en', 'actualizada_en')
    
    def get_aprobador(self, obj):
        """Retorna el ID del aprobador (jefatura o dirección)"""
        try:
            if hasattr(obj, 'jefatura_aprobador') and obj.jefatura_aprobador:
                return str(obj.jefatura_aprobador.id)
            elif hasattr(obj, 'direccion_aprobador') and obj.direccion_aprobador:
                return str(obj.direccion_aprobador.id)
        except Exception:
            pass
        return None
    
    def get_aprobador_nombre(self, obj):
        """Retorna el nombre del aprobador"""
        try:
            if hasattr(obj, 'jefatura_aprobador') and obj.jefatura_aprobador:
                return obj.jefatura_aprobador.get_nombre_completo()
            elif hasattr(obj, 'direccion_aprobador') and obj.direccion_aprobador:
                return obj.direccion_aprobador.get_nombre_completo()
        except Exception:
            pass
        return None
    
    def get_fecha_aprobacion(self, obj):
        """Retorna la fecha de aprobación"""
        try:
            if hasattr(obj, 'fecha_aprobacion_jefatura') and obj.fecha_aprobacion_jefatura:
                return obj.fecha_aprobacion_jefatura.isoformat()
            elif hasattr(obj, 'fecha_aprobacion_direccion') and obj.fecha_aprobacion_direccion:
                return obj.fecha_aprobacion_direccion.isoformat()
        except Exception:
            pass
        return None
    
    def get_comentario_aprobacion(self, obj):
        """Retorna los comentarios de aprobación"""
        try:
            if hasattr(obj, 'comentarios_jefatura') and obj.comentarios_jefatura:
                return obj.comentarios_jefatura
            elif hasattr(obj, 'comentarios_direccion') and obj.comentarios_direccion:
                return obj.comentarios_direccion
        except Exception:
            pass
        return None
    
    # Métodos para campos de jefatura
    def get_jefatura_aprobador_nombre(self, obj):
        """Retorna el nombre del aprobador de jefatura o None"""
        try:
            if hasattr(obj, 'jefatura_aprobador') and obj.jefatura_aprobador:
                return obj.jefatura_aprobador.get_nombre_completo()
        except Exception:
            pass
        return None
    
    def get_jefatura_fecha_aprobacion(self, obj):
        """Retorna la fecha de aprobación de jefatura o None"""
        try:
            if hasattr(obj, 'fecha_aprobacion_jefatura') and obj.fecha_aprobacion_jefatura:
                return obj.fecha_aprobacion_jefatura.isoformat()
        except Exception:
            pass
        return None
    
    def get_jefatura_comentarios(self, obj):
        """Retorna los comentarios de jefatura o None"""
        try:
            if hasattr(obj, 'comentarios_jefatura') and obj.comentarios_jefatura:
                return obj.comentarios_jefatura
        except Exception:
            pass
        return None
    
    # Métodos para campos de dirección
    def get_direccion_aprobador_nombre(self, obj):
        """Retorna el nombre del aprobador de dirección o None"""
        try:
            if hasattr(obj, 'direccion_aprobador') and obj.direccion_aprobador:
                return obj.direccion_aprobador.get_nombre_completo()
        except Exception:
            pass
        return None
    
    def get_direccion_fecha_aprobacion(self, obj):
        """Retorna la fecha de aprobación de dirección o None"""
        try:
            if hasattr(obj, 'fecha_aprobacion_direccion') and obj.fecha_aprobacion_direccion:
                return obj.fecha_aprobacion_direccion.isoformat()
        except Exception:
            pass
        return None
    
    def get_direccion_comentarios(self, obj):
        """Retorna los comentarios de dirección o None"""
        try:
            if hasattr(obj, 'comentarios_direccion') and obj.comentarios_direccion:
                return obj.comentarios_direccion
        except Exception:
            pass
        return None


class SolicitudDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle de solicitud"""
    usuario_nombre = serializers.CharField(source='usuario.get_nombre_completo', read_only=True)
    area_nombre = serializers.CharField(source='usuario.area.nombre', read_only=True)
    jefatura_nombre = serializers.CharField(source='jefatura_aprobador.get_nombre_completo', read_only=True)
    direccion_nombre = serializers.CharField(source='direccion_aprobador.get_nombre_completo', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = Solicitud
        fields = '__all__'
        read_only_fields = (
            'id', 'numero_solicitud', 'estado', 'fecha_solicitud',
            'aprobada_por_jefatura', 'jefatura_aprobador', 'fecha_aprobacion_jefatura',
            'aprobada_por_direccion', 'direccion_aprobador', 'fecha_aprobacion_direccion',
            'pdf_generado', 'url_pdf', 'creada_en', 'actualizada_en'
        )


class SolicitudCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear solicitud"""
    class Meta:
        model = Solicitud
        fields = [
            'tipo', 'fecha_inicio', 'fecha_termino',
            'cantidad_dias', 'motivo', 'telefono_contacto'
        ]
    
    def validate(self, data):
        # Validar fechas
        if data['fecha_inicio'] > data['fecha_termino']:
            raise serializers.ValidationError("La fecha de inicio debe ser anterior a la fecha de término")
        return data


class SolicitudAprobacionSerializer(serializers.Serializer):
    """Serializer para aprobar/rechazar solicitudes"""
    aprobar = serializers.BooleanField(required=True)
    comentarios = serializers.CharField(required=False, allow_blank=True)


# ======================================================
# LICENCIA MÉDICA SERIALIZER
# ======================================================

class LicenciaMedicaSerializer(serializers.ModelSerializer):
    """Serializer actualizado para licencias médicas (Enfoque en Privacidad y Flujo)"""
    
    # Campos de solo lectura para mostrar información amigable en el frontend
    usuario_nombre = serializers.CharField(source='usuario.get_nombre_completo', read_only=True)
    area_nombre = serializers.CharField(source='usuario.area.nombre', read_only=True)
    revisada_por_nombre = serializers.CharField(source='revisada_por.get_nombre_completo', read_only=True, default=None)
    
    # Muestra el texto legible del estado (ej: "Pendiente de Revisión" en lugar de "pendiente")
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    # Como en el modelo usamos @property para esta_vigente, se puede declarar así:
    esta_vigente = serializers.BooleanField(read_only=True)

    class Meta:
        model = LicenciaMedica
        fields = [
            'id', 
            'numero_licencia', 
            'usuario', 
            'usuario_nombre', 
            'area_nombre',
            'fecha_inicio', 
            'fecha_termino', 
            'dias_totales', 
            'documento_licencia',
            'estado', 
            'estado_display', 
            'revisada_por', 
            'revisada_por_nombre',
            'comentarios_revision', 
            'fecha_revision', 
            'creado_en', 
            'actualizada_en',
            'esta_vigente'
        ]
        
        # Campos que el usuario NO puede manipular al subir su licencia
        read_only_fields = (
            'id', 
            'dias_totales', 
            'estado', 
            'revisada_por', 
            'fecha_revision', 
            'creado_en', 
            'actualizada_en'
        )

    def validate(self, data):
        """Validaciones de lógica de fechas"""
        if data['fecha_inicio'] > data['fecha_termino']:
            raise serializers.ValidationError({
                "fecha_termino": "La fecha de término no puede ser anterior a la de inicio."
            })
        return data


# ======================================================
# ACTIVIDAD SERIALIZERS
# ======================================================

class InscripcionActividadSerializer(serializers.ModelSerializer):
    """Serializer para inscripción a actividad"""
    usuario_nombre = serializers.CharField(source='usuario.get_nombre_completo', read_only=True)
    
    class Meta:
        model = InscripcionActividad
        fields = '__all__'
        read_only_fields = ('id', 'fecha_inscripcion')


class ActividadListSerializer(serializers.ModelSerializer):
    """Serializer para listado de actividades"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_nombre_completo', read_only=True)
    total_inscritos = serializers.SerializerMethodField()
    tiene_cupos = serializers.SerializerMethodField()
    
    class Meta:
        model = Actividad
        fields = [
            'id', 'titulo', 'descripcion', 'tipo', 'tipo_display',
            'fecha_inicio', 'fecha_termino', 'ubicacion', 'color',
            'imagen', 'cupo_maximo', 'total_inscritos', 'tiene_cupos',
            'activa', 'creado_por_nombre', 'creado_en'
        ]
        read_only_fields = ('id', 'creado_en')
    
    def get_total_inscritos(self, obj):
        return obj.inscritos.count()
    
    def get_tiene_cupos(self, obj):
        return obj.tiene_cupos_disponibles()


class ActividadDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle de actividad"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_nombre_completo', read_only=True)
    areas_participantes_nombres = serializers.SerializerMethodField()
    inscritos_list = InscripcionActividadSerializer(source='inscripcionactividad_set', many=True, read_only=True)
    total_inscritos = serializers.SerializerMethodField()
    tiene_cupos = serializers.SerializerMethodField()
    
    class Meta:
        model = Actividad
        fields = '__all__'
        read_only_fields = ('id', 'creado_en', 'actualizado_en')
    
    def get_areas_participantes_nombres(self, obj):
        return [area.nombre for area in obj.areas_participantes.all()]
    
    def get_total_inscritos(self, obj):
        return obj.inscritos.count()
    
    def get_tiene_cupos(self, obj):
        return obj.tiene_cupos_disponibles()


# ======================================================
# ANUNCIO SERIALIZERS
# ======================================================

class AdjuntoAnuncioSerializer(serializers.ModelSerializer):
    """Serializer para adjuntos de anuncio"""
    class Meta:
        model = AdjuntoAnuncio
        fields = '__all__'
        read_only_fields = ('id', 'subido_en')


class AnuncioListSerializer(serializers.ModelSerializer):
    """Serializer para listado de anuncios"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    visibilidad_roles_display = serializers.CharField(source='get_visibilidad_roles_display', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_nombre_completo', read_only=True)
    areas_destinatarias_nombres = serializers.SerializerMethodField()
    adjuntos = AdjuntoAnuncioSerializer(many=True, read_only=True)
    esta_vigente = serializers.SerializerMethodField()
    
    class Meta:
        model = Anuncio
        fields = [
            'id', 'titulo', 'contenido', 'tipo', 'tipo_display', 'es_destacado',
            'prioridad', 'fecha_publicacion', 'fecha_expiracion',
            'imagen', 'activo', 'esta_vigente', 'creado_por_nombre',
            'creado_en', 'visibilidad_roles', 'visibilidad_roles_display',
            'para_todas_areas', 'areas_destinatarias_nombres', 'adjuntos'
        ]
        read_only_fields = ('id', 'creado_en')
    
    def get_areas_destinatarias_nombres(self, obj):
        return [area.nombre for area in obj.areas_destinatarias.all()]
    
    def get_esta_vigente(self, obj):
        return obj.esta_vigente()


class AnuncioDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle de anuncio"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    visibilidad_roles_display = serializers.CharField(source='get_visibilidad_roles_display', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_nombre_completo', read_only=True)
    areas_destinatarias_nombres = serializers.SerializerMethodField()
    adjuntos = AdjuntoAnuncioSerializer(many=True, read_only=True)
    esta_vigente = serializers.SerializerMethodField()
    
    class Meta:
        model = Anuncio
        fields = '__all__'
        read_only_fields = ('id', 'creado_en', 'actualizado_en')
    
    def get_areas_destinatarias_nombres(self, obj):
        return [area.nombre for area in obj.areas_destinatarias.all()]
    
    def get_esta_vigente(self, obj):
        return obj.esta_vigente()



# ======================================================
# DOCUMENTO SERIALIZERS
# ======================================================

class DocumentoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de documentos"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    subido_por_nombre = serializers.CharField(source='subido_por.get_nombre_completo', read_only=True)
    esta_vigente = serializers.SerializerMethodField()
    url_descarga = serializers.SerializerMethodField()
    
    class Meta:
        model = Documento
        fields = [
            'id', 'codigo_documento', 'titulo', 'tipo', 'tipo_display',
            'categoria', 'categoria_nombre', 'extension', 'tamano',
            'nombre_archivo', 'mime_type', 'storage_type',
            'version', 'fecha_vigencia', 'fecha_expiracion',
            'publico', 'descargas', 'visualizaciones', 'activo',
            'esta_vigente', 'subido_por_nombre', 'subido_en', 'url_descarga'
        ]
        read_only_fields = (
            'id', 'codigo_documento', 'descargas', 'visualizaciones',
            'subido_en', 'storage_type'
        )
    
    def get_esta_vigente(self, obj):
        return obj.esta_vigente()
    
    def get_url_descarga(self, obj):
        return obj.get_url_descarga()


class DocumentoDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle de documento"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    subido_por_nombre = serializers.CharField(source='subido_por.get_nombre_completo', read_only=True)
    areas_con_acceso_nombres = serializers.SerializerMethodField()
    esta_vigente = serializers.SerializerMethodField()
    url_descarga = serializers.SerializerMethodField()
    
    class Meta:
        model = Documento
        fields = [
            'id', 'codigo_documento', 'titulo', 'descripcion', 'tipo', 'tipo_display',
            'categoria', 'categoria_nombre', 'storage_type',
            'nombre_archivo', 'tamano', 'extension', 'mime_type',
            'archivo_url', 'url_descarga',
            'version', 'fecha_vigencia', 'fecha_expiracion',
            'publico', 'areas_con_acceso', 'areas_con_acceso_nombres',
            'descargas', 'visualizaciones', 'activo', 'esta_vigente',
            'subido_por', 'subido_por_nombre', 'subido_en', 'actualizado_en'
        ]
        read_only_fields = (
            'id', 'codigo_documento', 'descargas', 'visualizaciones',
            'subido_en', 'actualizado_en', 'storage_type', 'archivo_url'
        )
    
    def get_areas_con_acceso_nombres(self, obj):
        return [area.nombre for area in obj.areas_con_acceso.all()]
    
    def get_esta_vigente(self, obj):
        return obj.esta_vigente()
    
    def get_url_descarga(self, obj):
        return obj.get_url_descarga()


class DocumentoCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear documentos con archivo"""
    archivo = serializers.FileField(write_only=True)
    
    class Meta:
        model = Documento
        fields = [
            'titulo', 'descripcion', 'tipo', 'categoria',
            'version', 'fecha_vigencia', 'fecha_expiracion',
            'publico', 'areas_con_acceso', 'archivo'
        ]
    
    def create(self, validated_data):
        archivo = validated_data.pop('archivo')
        areas_con_acceso = validated_data.pop('areas_con_acceso', [])
        
        # Extraer información del archivo
        nombre_archivo = archivo.name
        extension = nombre_archivo.split('.')[-1] if '.' in nombre_archivo else ''
        tamano = archivo.size
        mime_type = archivo.content_type or 'application/octet-stream'
        
        # Leer contenido del archivo
        archivo_contenido = archivo.read()
        
        # Crear el documento
        documento = Documento.objects.create(
            storage_type='database',
            nombre_archivo=nombre_archivo,
            extension=extension,
            tamano=tamano,
            mime_type=mime_type,
            archivo_contenido=archivo_contenido,
            **validated_data
        )
        
        # Asignar areas_con_acceso después de crear el objeto
        if areas_con_acceso:
            documento.areas_con_acceso.set(areas_con_acceso)
        
        return documento


# ======================================================
# NOTIFICACIÓN SERIALIZER
# ======================================================

class NotificacionSerializer(serializers.ModelSerializer):
    """Serializer para notificaciones"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = Notificacion
        fields = '__all__'
        read_only_fields = ('id', 'creada_en')


# ======================================================
# LOG AUDITORÍA SERIALIZER
# ======================================================

class LogAuditoriaSerializer(serializers.ModelSerializer):
    """Serializer para logs de auditoría"""
    usuario_nombre = serializers.CharField(source='usuario.get_nombre_completo', read_only=True)
    accion_display = serializers.CharField(source='get_accion_display', read_only=True)
    
    class Meta:
        model = LogAuditoria
        fields = '__all__'
        read_only_fields = ('id', 'timestamp')