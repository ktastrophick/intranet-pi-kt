# ======================================================
# MODELS.PY - Base de Datos Completa CESFAM Santa Rosa
# Ubicación: backend/intranet/models.py
# ======================================================

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.core.exceptions import ValidationError
import uuid


# ======================================================
# 1. GESTIÓN DE USUARIOS Y AUTENTICACIÓN
# ======================================================

class UsuarioManager(BaseUserManager):
    """Manager personalizado para el modelo Usuario"""
    
    def create_user(self, rut, email, password=None, **extra_fields):
        """Crea y guarda un Usuario normal"""
        if not rut:
            raise ValueError('El usuario debe tener un RUT')
        if not email:
            raise ValueError('El usuario debe tener un email')
        
        email = self.normalize_email(email)
        user = self.model(rut=rut, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, rut, email, password=None, **extra_fields):
        """Crea y guarda un superusuario (Dirección)"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser debe tener is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser debe tener is_superuser=True')
        
        return self.create_user(rut, email, password, **extra_fields)


class Rol(models.Model):
    """
    Roles del sistema con permisos jerárquicos
    """
    NIVEL_CHOICES = [
        (1, 'Funcionario'),       # Nivel más bajo
        (2, 'Jefatura'),          # Jefe de área
        (3, 'Subdirección'),      # Subdirección Administrativa o Clínica
        (4, 'Dirección'),         # Nivel máximo
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    nivel = models.IntegerField(choices=NIVEL_CHOICES, default=1)
    
    # Permisos específicos
    puede_crear_usuarios = models.BooleanField(default=False)
    puede_eliminar_contenido = models.BooleanField(default=False)
    puede_aprobar_solicitudes = models.BooleanField(default=False)
    puede_subir_documentos = models.BooleanField(default=False)
    puede_crear_actividades = models.BooleanField(default=False)
    puede_crear_anuncios = models.BooleanField(default=False)
    puede_gestionar_licencias = models.BooleanField(default=False)
    puede_ver_reportes = models.BooleanField(default=False)
    puede_editar_calendario = models.BooleanField(default=False)
    
    # Auditoría
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['-nivel']
    
    def __str__(self):
        return f"{self.nombre} (Nivel {self.nivel})"


class Area(models.Model):
    """
    Áreas o Departamentos del CESFAM
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    codigo = models.CharField(max_length=20, unique=True)  # Ej: MED-001
    color = models.CharField(max_length=7, default='#3B82F6')  # Color en hex
    icono = models.CharField(max_length=50, default='🏥')  # Emoji o nombre de icono
    
    # Jefatura del área
    jefe = models.ForeignKey(
        'Usuario',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='area_a_cargo'
    )
    
    # Metadata
    activa = models.BooleanField(default=True)
    creada_en = models.DateTimeField(auto_now_add=True)
    actualizada_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Área'
        verbose_name_plural = 'Áreas'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class Usuario(AbstractBaseUser, PermissionsMixin):
    """
    Modelo de Usuario personalizado para el CESFAM
    """
    # Validador de RUT chileno
    rut_validator = RegexValidator(
        regex=r'^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$',
        message='El RUT debe tener formato XX.XXX.XXX-X'
    )
    
    # Identificación
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rut = models.CharField(
        max_length=12,
        unique=True,
        validators=[rut_validator],
        help_text='Formato: XX.XXX.XXX-X'
    )
    
    # Datos personales
    nombre = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100)
    apellido_materno = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=20, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    direccion = models.TextField(blank=True)
    
    # Información profesional
    cargo = models.CharField(max_length=150)
    area = models.ForeignKey(
        Area,
        on_delete=models.PROTECT,
        related_name='funcionarios'
    )
    rol = models.ForeignKey(
        Rol,
        on_delete=models.PROTECT,
        related_name='usuarios'
    )
    fecha_ingreso = models.DateField()
    
    # Jefatura (para usuarios que son jefes)
    es_jefe_de_area = models.BooleanField(default=False)
    
    # Contacto de emergencia
    contacto_emergencia_nombre = models.CharField(max_length=200, blank=True)
    contacto_emergencia_telefono = models.CharField(max_length=20, blank=True)
    contacto_emergencia_relacion = models.CharField(max_length=100, blank=True)
    
    # DÍAS DISPONIBLES (NUEVO)
    dias_vacaciones_anuales = models.IntegerField(
        default=15,
        validators=[MinValueValidator(0), MaxValueValidator(30)],
        help_text='Días de vacaciones totales por año'
    )
    dias_vacaciones_disponibles = models.IntegerField(
        default=15,
        validators=[MinValueValidator(0)],
        help_text='Días de vacaciones disponibles actualmente'
    )
    dias_vacaciones_usados = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Días de vacaciones ya utilizados este año'
    )
    
    dias_administrativos_anuales = models.IntegerField(
        default=6,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text='Días administrativos totales por año'
    )
    dias_administrativos_disponibles = models.IntegerField(
        default=6,
        validators=[MinValueValidator(0)],
        help_text='Días administrativos disponibles actualmente'
    )
    dias_administrativos_usados = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Días administrativos ya utilizados este año'
    )
    
    # Avatar y preferencias
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    tema_preferido = models.CharField(
        max_length=10,
        choices=[('light', 'Claro'), ('dark', 'Oscuro')],
        default='light'
    )
    
    # Estado y permisos de Django
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    # Auditoría
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    ultimo_acceso = models.DateTimeField(null=True, blank=True)
    
    objects = UsuarioManager()
    
    USERNAME_FIELD = 'rut'
    REQUIRED_FIELDS = ['email', 'nombre', 'apellido_paterno']
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['apellido_paterno', 'apellido_materno', 'nombre']
        indexes = [
            models.Index(fields=['rut']),
            models.Index(fields=['email']),
            models.Index(fields=['area', 'rol']),
        ]
    
    def __str__(self):
        return f"{self.get_nombre_completo()} ({self.rut})"
    
    def get_nombre_completo(self):
        """Retorna nombre completo del usuario"""
        return f"{self.nombre} {self.apellido_paterno} {self.apellido_materno}"
    
    def puede_aprobar_solicitud(self, solicitud):
        """Verifica si el usuario puede aprobar una solicitud"""
        # Dirección puede aprobar todo
        if self.rol.nivel == 4:
            return True
        
        # Subdirección puede aprobar todo
        if self.rol.nivel == 3:
            return True
        
        # Jefatura solo puede aprobar de su área
        if self.rol.nivel == 2 and solicitud.usuario.area == self.area:
            return True
        
        return False
    
    def actualizar_dias_disponibles(self):
        """Recalcula días disponibles basado en solicitudes aprobadas"""
        # Calcular días de vacaciones usados
        vacaciones_usadas = self.solicitudes.filter(
            tipo='vacaciones',
            estado='aprobada'
        ).aggregate(
            total=models.Sum('cantidad_dias')
        )['total'] or 0
        
        # Calcular días administrativos usados
        admin_usados = self.solicitudes.filter(
            tipo='dia_administrativo',
            estado='aprobada'
        ).aggregate(
            total=models.Sum('cantidad_dias')
        )['total'] or 0
        
        # Actualizar
        self.dias_vacaciones_usados = vacaciones_usadas
        self.dias_vacaciones_disponibles = self.dias_vacaciones_anuales - vacaciones_usadas
        
        self.dias_administrativos_usados = admin_usados
        self.dias_administrativos_disponibles = self.dias_administrativos_anuales - admin_usados
        
        self.save()


# ======================================================
# 2. GESTIÓN DE ACTIVIDADES Y EVENTOS
# ======================================================

class Actividad(models.Model):
    """
    Actividades institucionales (sociales, deportivas, etc.)
    """
    TIPO_CHOICES = [
        ('gastronomica', 'Gastronómica'),
        ('deportiva', 'Deportiva'),
        ('celebracion', 'Celebración'),
        ('comunitaria', 'Comunitaria'),
        ('cultural', 'Cultural'),
        ('capacitacion', 'Capacitación'),
        ('otra', 'Otra'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='otra')
    
    # Fechas y horarios
    fecha_inicio = models.DateTimeField()
    fecha_termino = models.DateTimeField()
    todo_el_dia = models.BooleanField(default=False)
    
    # Detalles
    ubicacion = models.CharField(max_length=200, blank=True)
    color = models.CharField(max_length=7, default='#3B82F6')
    imagen = models.ImageField(upload_to='actividades/', blank=True, null=True)
    
    # Participantes
    para_todas_areas = models.BooleanField(default=True)
    areas_participantes = models.ManyToManyField(Area, blank=True)
    cupo_maximo = models.IntegerField(null=True, blank=True)
    inscritos = models.ManyToManyField(Usuario, through='InscripcionActividad', related_name='actividades_inscritas')
    
    # Auditoría
    creado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='actividades_creadas')
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    activa = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Actividad'
        verbose_name_plural = 'Actividades'
        ordering = ['-fecha_inicio']
        indexes = [
            models.Index(fields=['fecha_inicio', 'fecha_termino']),
            models.Index(fields=['tipo']),
        ]
    
    def __str__(self):
        return f"{self.titulo} ({self.fecha_inicio.strftime('%d/%m/%Y')})"
    
    def tiene_cupos_disponibles(self):
        """Verifica si hay cupos disponibles"""
        if not self.cupo_maximo:
            return True
        return self.inscritos.count() < self.cupo_maximo


class InscripcionActividad(models.Model):
    """Tabla intermedia para inscripciones a actividades"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actividad = models.ForeignKey(Actividad, on_delete=models.CASCADE)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    fecha_inscripcion = models.DateTimeField(auto_now_add=True)
    asistio = models.BooleanField(null=True, blank=True)
    
    class Meta:
        unique_together = ['actividad', 'usuario']
        verbose_name = 'Inscripción a Actividad'
        verbose_name_plural = 'Inscripciones a Actividades'


class Anuncio(models.Model):
    """
    Anuncios y comunicados oficiales
    """
    TIPO_CHOICES = [
        ('informativo', 'Informativo'),
        ('urgente', 'Urgente'),
        ('recordatorio', 'Recordatorio'),
        ('felicitacion', 'Felicitación'),
        ('normativa', 'Normativa'),
        ('administrativa', 'Administrativa'),
    ]
    
    VISIBILIDAD_ROLES_CHOICES = [
        ('solo_funcionarios', 'Solo Funcionarios'),
        ('solo_jefatura', 'Solo Jefatura'),
        ('funcionarios_y_jefatura', 'Funcionarios y Jefatura'),
        ('solo_direccion', 'Solo Dirección y Subdirección'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='informativo')
    
    # Fechas
    fecha_publicacion = models.DateTimeField(default=timezone.now)
    fecha_expiracion = models.DateTimeField(null=True, blank=True)
    
    # Destacado y prioridad
    es_destacado = models.BooleanField(default=False)
    prioridad = models.IntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(5)])
    
    # Archivos adjuntos
    imagen = models.ImageField(upload_to='anuncios/', blank=True, null=True)
    
    # Destinatarios por áreas
    para_todas_areas = models.BooleanField(default=True)
    areas_destinatarias = models.ManyToManyField(Area, blank=True)
    
    # Destinatarios por roles
    visibilidad_roles = models.CharField(
        max_length=30,
        choices=VISIBILIDAD_ROLES_CHOICES,
        default='funcionarios_y_jefatura',
        help_text='Determina qué roles pueden ver este anuncio. Dirección y Subdirección siempre pueden ver todos los anuncios.'
    )
    
    # Estado
    activo = models.BooleanField(default=True)
    
    # Auditoría
    creado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='anuncios_creados')
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Anuncio'
        verbose_name_plural = 'Anuncios'
        ordering = ['-fecha_publicacion', '-prioridad']
        indexes = [
            models.Index(fields=['fecha_publicacion']),
            models.Index(fields=['tipo']),
            models.Index(fields=['es_destacado']),
            models.Index(fields=['visibilidad_roles']),
        ]
    
    def __str__(self):
        return f"{self.titulo} ({self.tipo})"
    
    def esta_vigente(self):
        """Verifica si el anuncio está vigente"""
        now = timezone.now()
        if self.fecha_expiracion:
            return self.activo and now <= self.fecha_expiracion
        return self.activo
    
    def puede_ver(self, usuario):
        """
        Determina si un usuario puede ver este anuncio basándose en su rol
        """
        nivel_usuario = usuario.rol.nivel
        
        # Dirección y Subdirección siempre pueden ver todo
        if nivel_usuario >= 3:
            return True
        
        # Verificar visibilidad por rol
        if self.visibilidad_roles == 'solo_funcionarios':
            return nivel_usuario == 1
        elif self.visibilidad_roles == 'solo_jefatura':
            return nivel_usuario == 2
        elif self.visibilidad_roles == 'funcionarios_y_jefatura':
            return nivel_usuario in [1, 2]
        elif self.visibilidad_roles == 'solo_direccion':
            return False  # Solo dirección/subdirección, y ya se verificó arriba
        
        return False


class AdjuntoAnuncio(models.Model):
    """Archivos adjuntos de anuncios"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    anuncio = models.ForeignKey(Anuncio, on_delete=models.CASCADE, related_name='adjuntos')
    nombre_archivo = models.CharField(max_length=255)
    archivo = models.FileField(upload_to='anuncios/adjuntos/')
    tipo_archivo = models.CharField(max_length=50)  # pdf, doc, xls, etc.
    tamano = models.IntegerField()  # en bytes
    subido_en = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Adjunto de Anuncio'
        verbose_name_plural = 'Adjuntos de Anuncios'
    
    def __str__(self):
        return self.nombre_archivo


# ======================================================
# 3. GESTIÓN DE SOLICITUDES (Vacaciones y Días Admin)
# ======================================================

class Solicitud(models.Model):
    """
    Solicitudes de vacaciones y días administrativos
    """
    TIPO_CHOICES = [
        ('vacaciones', 'Vacaciones'),
        ('dia_administrativo', 'Día Administrativo'),
    ]
    
    ESTADO_CHOICES = [
        ('pendiente_jefatura', 'Pendiente Jefatura'),
        ('aprobada_jefatura', 'Aprobada por Jefatura'),
        ('rechazada_jefatura', 'Rechazada por Jefatura'),
        ('pendiente_direccion', 'Pendiente Dirección'),
        ('aprobada', 'Aprobada Completamente'),
        ('rechazada_direccion', 'Rechazada por Dirección'),
        ('cancelada', 'Cancelada'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero_solicitud = models.CharField(max_length=20, unique=True, editable=False)
    
    # Solicitante
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='solicitudes')
    
    # Tipo y fechas
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    fecha_inicio = models.DateField()
    fecha_termino = models.DateField()
    cantidad_dias = models.IntegerField(validators=[MinValueValidator(1)])
    
    # Detalles
    motivo = models.TextField()
    telefono_contacto = models.CharField(max_length=20)
    
    # Estado
    estado = models.CharField(max_length=30, choices=ESTADO_CHOICES, default='pendiente_jefatura')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    
    # Aprobación Jefatura
    aprobada_por_jefatura = models.BooleanField(null=True, blank=True)
    jefatura_aprobador = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='solicitudes_aprobadas_jefatura'
    )
    fecha_aprobacion_jefatura = models.DateTimeField(null=True, blank=True)
    comentarios_jefatura = models.TextField(blank=True)
    
    # Aprobación Dirección/Subdirección
    aprobada_por_direccion = models.BooleanField(null=True, blank=True)
    direccion_aprobador = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='solicitudes_aprobadas_direccion'
    )
    fecha_aprobacion_direccion = models.DateTimeField(null=True, blank=True)
    comentarios_direccion = models.TextField(blank=True)
    
    # Documento generado
    pdf_generado = models.BooleanField(default=False)
    url_pdf = models.CharField(max_length=500, blank=True)
    
    # Auditoría
    creada_en = models.DateTimeField(auto_now_add=True)
    actualizada_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Solicitud'
        verbose_name_plural = 'Solicitudes'
        ordering = ['-fecha_solicitud']
        indexes = [
            models.Index(fields=['usuario', 'estado']),
            models.Index(fields=['fecha_inicio', 'fecha_termino']),
            models.Index(fields=['estado']),
        ]
    
    def __str__(self):
        return f"{self.numero_solicitud} - {self.usuario.get_nombre_completo()} ({self.get_tipo_display()})"
    
    def save(self, *args, **kwargs):
        # Generar número de solicitud automáticamente
        if not self.numero_solicitud:
            year = timezone.now().year
            count = Solicitud.objects.filter(
                fecha_solicitud__year=year
            ).count() + 1
            self.numero_solicitud = f"SOL-{year}-{count:04d}"
        
        super().save(*args, **kwargs)
    
    def aprobar_jefatura(self, jefe, comentarios=''):
        """Aprueba la solicitud por parte de la jefatura"""
        self.aprobada_por_jefatura = True
        self.jefatura_aprobador = jefe
        self.fecha_aprobacion_jefatura = timezone.now()
        self.comentarios_jefatura = comentarios
        self.estado = 'pendiente_direccion'
        self.save()
    
    def rechazar_jefatura(self, jefe, comentarios=''):
        """Rechaza la solicitud por parte de la jefatura"""
        self.aprobada_por_jefatura = False
        self.jefatura_aprobador = jefe
        self.fecha_aprobacion_jefatura = timezone.now()
        self.comentarios_jefatura = comentarios
        self.estado = 'rechazada_jefatura'
        self.save()
    
    def aprobar_direccion(self, director, comentarios=''):
        """Aprueba la solicitud por parte de dirección"""
        self.aprobada_por_direccion = True
        self.direccion_aprobador = director
        self.fecha_aprobacion_direccion = timezone.now()
        self.comentarios_direccion = comentarios
        self.estado = 'aprobada'
        
        # Actualizar días disponibles del usuario
        self.usuario.actualizar_dias_disponibles()
        self.save()
    
    def rechazar_direccion(self, director, comentarios=''):
        """Rechaza la solicitud por parte de dirección"""
        self.aprobada_por_direccion = False
        self.direccion_aprobador = director
        self.fecha_aprobacion_direccion = timezone.now()
        self.comentarios_direccion = comentarios
        self.estado = 'rechazada_direccion'
        self.save()


# ======================================================
# 4. GESTIÓN DE LICENCIAS MÉDICAS
# ======================================================

class LicenciaMedica(models.Model):
    """
    Registro de licencias médicas de funcionarios.
    Rediseñado para privacidad (sin diagnóstico) y flujo de gestión profesional.
    """
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente de Revisión'),
        ('aprobada', 'Aprobada'),
        ('rechazada', 'Rechazada'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Identificación de la licencia
    numero_licencia = models.CharField(
        max_length=50, 
        unique=True, 
        verbose_name="Número de Folio"
    )

    # El usuario que solicita/sube su licencia
    usuario = models.ForeignKey(
        'Usuario', 
        on_delete=models.CASCADE, 
        related_name='licencias'
    )

    # Fechas y cálculo de tiempo
    fecha_inicio = models.DateField()
    fecha_termino = models.DateField()
    dias_totales = models.IntegerField(editable=False)

    # Documentación adjunta
    documento_licencia = models.FileField(
        upload_to='licencias/%Y/%m/', 
        help_text='Cargue el documento o foto de su licencia (PDF, JPG, PNG)'
    )

    # Control de Estado
    estado = models.CharField(
        max_length=20, 
        choices=ESTADO_CHOICES, 
        default='pendiente'
    )

    # Auditoría de Revisión (Siguiendo el estilo de Solicitud)
    revisada_por = models.ForeignKey(
        'Usuario',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='licencias_auditadas'
    )
    comentarios_revision = models.TextField(
        blank=True, 
        help_text="Motivo de rechazo o notas de la revisión"
    )
    fecha_revision = models.DateTimeField(null=True, blank=True)

    # Metadata automática
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizada_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Licencia Médica'
        verbose_name_plural = 'Licencias Médicas'
        ordering = ['-fecha_inicio']
        indexes = [
            models.Index(fields=['usuario', 'estado']),
            models.Index(fields=['fecha_inicio', 'fecha_termino']),
            models.Index(fields=['revisada_por']), # Nuevo índice para optimizar filtros de subdirectora
        ]

    def __str__(self):
        return f"Licencia {self.numero_licencia} - {self.usuario.get_nombre_completo()}"

    def save(self, *args, **kwargs):
        """Calcula automáticamente los días totales antes de guardar"""
        if self.fecha_inicio and self.fecha_termino:
            delta = self.fecha_termino - self.fecha_inicio
            self.dias_totales = delta.days + 1
        super().save(*args, **kwargs)

    # --- MÉTODOS DE ACCIÓN (Lógica de Negocio centralizada) ---

    def aprobar(self, revisor, comentarios=''):
        """Aprueba la licencia y registra al auditor"""
        self.estado = 'aprobada'
        self.revisada_por = revisor
        self.fecha_revision = timezone.now()
        self.comentarios_revision = comentarios
        self.save()

    def rechazar(self, revisor, comentarios):
        """Rechaza la licencia. Los comentarios son obligatorios para transparencia"""
        if not comentarios:
            raise ValueError("Debe proporcionar un motivo para el rechazo.")
        self.estado = 'rechazada'
        self.revisada_por = revisor
        self.fecha_revision = timezone.now()
        self.comentarios_revision = comentarios
        self.save()

    # --- PROPIEDADES PARA EL FRONTEND ---

    @property
    def esta_vigente(self):
        """Verifica si la licencia está transcurriendo hoy"""
        hoy = timezone.now().date()
        return self.fecha_inicio <= hoy <= self.fecha_termino

    @property
    def dias_restantes(self):
        """Si está vigente, indica cuántos días quedan"""
        hoy = timezone.now().date()
        if self.esta_vigente:
            delta = self.fecha_termino - hoy
            return delta.days
        return 0


# ======================================================
# 5. GESTIÓN DE DOCUMENTOS Y ARCHIVOS
# ======================================================

class CategoriaDocumento(models.Model):
    """Categorías para organizar documentos"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    icono = models.CharField(max_length=50, default='📄')
    color = models.CharField(max_length=7, default='#3B82F6')
    orden = models.IntegerField(default=0)
    activa = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Categoría de Documento'
        verbose_name_plural = 'Categorías de Documentos'
        ordering = ['orden', 'nombre']
    
    def __str__(self):
        return self.nombre


class Documento(models.Model):
    """
    Documentos institucionales (circulares, protocolos, etc.)
    Soporta almacenamiento en BD (actual) y S3 (futuro)
    """
    TIPO_CHOICES = [
        ('circular', 'Circular'),
        ('protocolo', 'Protocolo'),
        ('formulario', 'Formulario'),
        ('guia', 'Guía'),
        ('reglamento', 'Reglamento'),
        ('manual', 'Manual'),
        ('informe', 'Informe'),
        ('otro', 'Otro'),
    ]
    
    STORAGE_CHOICES = [
        ('database', 'Base de Datos'),
        ('s3', 'Amazon S3'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo_documento = models.CharField(max_length=50, unique=True, blank=True)
    
    # Información básica
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField()
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    categoria = models.ForeignKey(CategoriaDocumento, on_delete=models.PROTECT)
    
    # Archivo - Almacenamiento híbrido
    storage_type = models.CharField(max_length=20, choices=STORAGE_CHOICES, default='database')
    
    # Para almacenamiento en BD
    archivo_contenido = models.BinaryField(null=True, blank=True, editable=False)
    
    # Para almacenamiento en S3 (futuro)
    archivo_url = models.URLField(max_length=500, null=True, blank=True)
    
    # Metadata del archivo (siempre presente)
    nombre_archivo = models.CharField(max_length=255)
    tipo_archivo = models.CharField(max_length=50, blank=True, null=True, help_text='Tipo de archivo: pdf, imagen, video, etc.')
    tamano = models.IntegerField()  # en bytes
    extension = models.CharField(max_length=10)
    mime_type = models.CharField(max_length=100, default='application/octet-stream')
    
    # Versión y vigencia
    version = models.CharField(max_length=20, default='1.0')
    fecha_vigencia = models.DateField()
    fecha_expiracion = models.DateField(null=True, blank=True)
    
    # Permisos de acceso
    publico = models.BooleanField(default=True, help_text='Visible para todos los usuarios')
    areas_con_acceso = models.ManyToManyField(Area, blank=True)
    
    # Estadísticas
    descargas = models.IntegerField(default=0)
    visualizaciones = models.IntegerField(default=0)
    
    # Auditoría
    subido_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='documentos_subidos')
    subido_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    activo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Documento'
        verbose_name_plural = 'Documentos'
        ordering = ['-subido_en']
        indexes = [
            models.Index(fields=['tipo', 'categoria']),
            models.Index(fields=['fecha_vigencia']),
        ]
    
    def __str__(self):
        return f"{self.titulo} (v{self.version})"
    
    def save(self, *args, **kwargs):
        # Generar código automáticamente
        if not self.codigo_documento:
            year = timezone.now().year
            count = Documento.objects.filter(subido_en__year=year).count() + 1
            self.codigo_documento = f"DOC-{year}-{count:04d}"
        
        super().save(*args, **kwargs)
    
    def esta_vigente(self):
        """Verifica si el documento está vigente"""
        hoy = timezone.now().date()
        if self.fecha_expiracion:
            return self.fecha_vigencia <= hoy <= self.fecha_expiracion
        return hoy >= self.fecha_vigencia
    
    def get_url_descarga(self):
        """Retorna la URL para descargar el archivo"""
        if self.storage_type == 's3':
            return self.archivo_url
        else:
            # Para archivos en BD, usar endpoint de descarga
            return f"/api/documentos/{self.id}/download/"


# ======================================================
# 6. SISTEMA DE NOTIFICACIONES
# ======================================================

class Notificacion(models.Model):
    """
    Notificaciones para usuarios
    """
    TIPO_CHOICES = [
        ('solicitud_creada', 'Solicitud Creada'),
        ('solicitud_aprobada', 'Solicitud Aprobada'),
        ('solicitud_rechazada', 'Solicitud Rechazada'),
        ('nuevo_anuncio', 'Nuevo Anuncio'),
        ('nueva_actividad', 'Nueva Actividad'),
        ('documento_nuevo', 'Documento Nuevo'),
        ('licencia_registrada', 'Licencia Registrada'),
        ('recordatorio', 'Recordatorio'),
        ('sistema', 'Sistema'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='notificaciones')
    
    # Contenido
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    
    # Enlaces opcionales
    url = models.CharField(max_length=500, blank=True)
    icono = models.CharField(max_length=50, default='🔔')
    
    # Estado
    leida = models.BooleanField(default=False)
    fecha_leida = models.DateTimeField(null=True, blank=True)
    
    # Auditoría
    creada_en = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-creada_en']
        indexes = [
            models.Index(fields=['usuario', 'leida']),
            models.Index(fields=['creada_en']),
        ]
    
    def __str__(self):
        return f"{self.titulo} - {self.usuario.get_nombre_completo()}"
    
    def marcar_como_leida(self):
        """Marca la notificación como leída"""
        self.leida = True
        self.fecha_leida = timezone.now()
        self.save()


# ======================================================
# 7. LOGS Y AUDITORÍA
# ======================================================

class LogAuditoria(models.Model):
    """
    Registro de acciones importantes en el sistema
    """
    ACCION_CHOICES = [
        ('crear', 'Crear'),
        ('editar', 'Editar'),
        ('eliminar', 'Eliminar'),
        ('aprobar', 'Aprobar'),
        ('rechazar', 'Rechazar'),
        ('login', 'Inicio de Sesión'),
        ('logout', 'Cierre de Sesión'),
        ('descarga', 'Descarga'),
        ('visualizacion', 'Visualización'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Usuario que realiza la acción
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    
    # Detalles de la acción
    accion = models.CharField(max_length=20, choices=ACCION_CHOICES)
    modelo = models.CharField(max_length=100)  # Nombre del modelo afectado
    objeto_id = models.CharField(max_length=100)  # ID del objeto afectado
    descripcion = models.TextField()
    
    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Log de Auditoría'
        verbose_name_plural = 'Logs de Auditoría'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['usuario', 'timestamp']),
            models.Index(fields=['accion', 'modelo']),
        ]
    
    def __str__(self):
        return f"{self.usuario} - {self.accion} - {self.modelo} - {self.timestamp}"