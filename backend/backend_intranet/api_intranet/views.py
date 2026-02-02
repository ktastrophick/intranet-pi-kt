# ======================================================
# VIEWS.PY - Django REST Framework ViewSets
# Ubicación: api_intranet/views.py
# ======================================================

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone

from .models import (
    Usuario, Rol, Area, Solicitud,
    LicenciaMedica, Actividad, InscripcionActividad,
    Anuncio, AdjuntoAnuncio, Documento, CategoriaDocumento,
    Notificacion, LogAuditoria
)

from .serializers import (
    UsuarioListSerializer, UsuarioDetailSerializer, UsuarioCreateSerializer,
    RolSerializer, AreaSerializer,
    SolicitudListSerializer, SolicitudDetailSerializer, SolicitudCreateSerializer,
    SolicitudAprobacionSerializer,
    LicenciaMedicaSerializer,
    ActividadListSerializer, ActividadDetailSerializer, InscripcionActividadSerializer,
    AnuncioListSerializer, AnuncioDetailSerializer, AdjuntoAnuncioSerializer,
    DocumentoListSerializer, DocumentoDetailSerializer, DocumentoCreateSerializer,
    CategoriaDocumentoSerializer,
    NotificacionSerializer, LogAuditoriaSerializer
)


# ======================================================
# USUARIO VIEWSET
# ======================================================

class UsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de usuarios
    """
    queryset = Usuario.objects.select_related('rol', 'area').all()
    serializer_class = UsuarioDetailSerializer  # ← Usar el serializer completo
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['area', 'rol', 'is_active', 'es_jefe_de_area']
    search_fields = ['nombre', 'apellido_paterno', 'apellido_materno', 'rut', 'email']
    ordering_fields = ['apellido_paterno', 'nombre', 'fecha_ingreso']
    ordering = ['apellido_paterno', 'apellido_materno', 'nombre']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UsuarioListSerializer
        elif self.action == 'create':
            return UsuarioCreateSerializer
        return UsuarioDetailSerializer
    
    @action(detail=True, methods=['get'])
    def dias_disponibles(self, request, pk=None):
        """Obtener días disponibles del usuario"""
        usuario = self.get_object()
        return Response({
            'vacaciones': {
                'total_anuales': usuario.dias_vacaciones_anuales,
                'disponibles': usuario.dias_vacaciones_disponibles,
                'usados': usuario.dias_vacaciones_usados,
                'porcentaje_usado': (usuario.dias_vacaciones_usados / usuario.dias_vacaciones_anuales * 100) 
                    if usuario.dias_vacaciones_anuales > 0 else 0
            },
            'administrativos': {
                'total_anuales': usuario.dias_administrativos_anuales,
                'disponibles': usuario.dias_administrativos_disponibles,
                'usados': usuario.dias_administrativos_usados,
                'porcentaje_usado': (usuario.dias_administrativos_usados / usuario.dias_administrativos_anuales * 100) 
                    if usuario.dias_administrativos_anuales > 0 else 0
            }
        })
    
    @action(detail=True, methods=['post'])
    def actualizar_dias(self, request, pk=None):
        """Recalcular días disponibles del usuario"""
        usuario = self.get_object()
        usuario.actualizar_dias_disponibles()
        return Response({
            'message': 'Días actualizados correctamente',
            'vacaciones_disponibles': usuario.dias_vacaciones_disponibles,
            'administrativos_disponibles': usuario.dias_administrativos_disponibles
        })
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Obtener información del usuario actual"""
        serializer = UsuarioDetailSerializer(request.user)
        return Response(serializer.data)


# ======================================================
# ROL VIEWSET
# ======================================================

class RolViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de roles"""
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-nivel']


# ======================================================
# ÁREA VIEWSET
# ======================================================

class AreaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de áreas"""
    queryset = Area.objects.select_related('jefe').all()
    serializer_class = AreaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'codigo']
    ordering = ['nombre']
    
    @action(detail=True, methods=['get'])
    def funcionarios(self, request, pk=None):
        """Listar funcionarios del área"""
        area = self.get_object()
        funcionarios = area.funcionarios.all()
        serializer = UsuarioListSerializer(funcionarios, many=True)
        return Response(serializer.data)


# ======================================================
# SOLICITUD VIEWSET
# ======================================================

class SolicitudViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de solicitudes"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'estado', 'usuario__area']
    search_fields = ['numero_solicitud', 'usuario__nombre', 'usuario__rut']
    ordering_fields = ['fecha_solicitud', 'fecha_inicio']
    ordering = ['-fecha_solicitud']
    
    def get_queryset(self):
        user = self.request.user
        
        # Si es dirección o subdirección, ve todas
        if user.rol.nivel >= 3:
            return Solicitud.objects.select_related('usuario', 'usuario__area').all()
        
        # Si es jefatura, ve las de su área
        elif user.rol.nivel == 2:
            return Solicitud.objects.filter(usuario__area=user.area).select_related('usuario', 'usuario__area')
        
        # Funcionario ve solo las suyas
        else:
            return Solicitud.objects.filter(usuario=user).select_related('usuario', 'usuario__area')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SolicitudListSerializer
        elif self.action == 'create':
            return SolicitudCreateSerializer
        return SolicitudDetailSerializer
    
    def perform_create(self, serializer):
        """Crear solicitud asociándola al usuario actual"""
        serializer.save(usuario=self.request.user)
    
    @action(detail=True, methods=['post'])
    def aprobar_jefatura(self, request, pk=None):
        """Aprobar solicitud como jefatura"""
        solicitud = self.get_object()
        user = request.user
        
        # Verificar permisos
        if not user.puede_aprobar_solicitud(solicitud):
            return Response(
                {'error': 'No tienes permisos para aprobar esta solicitud'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validar estado
        if solicitud.estado != 'pendiente_jefatura':
            return Response(
                {'error': 'Esta solicitud no está en estado pendiente de jefatura'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = SolicitudAprobacionSerializer(data=request.data)
        if serializer.is_valid():
            if serializer.validated_data['aprobar']:
                solicitud.aprobar_jefatura(
                    jefe=user,
                    comentarios=serializer.validated_data.get('comentarios', '')
                )
                return Response({
                    'message': 'Solicitud aprobada por jefatura',
                    'nuevo_estado': solicitud.estado
                })
            else:
                solicitud.rechazar_jefatura(
                    jefe=user,
                    comentarios=serializer.validated_data.get('comentarios', '')
                )
                return Response({
                    'message': 'Solicitud rechazada por jefatura',
                    'nuevo_estado': solicitud.estado
                })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def aprobar_direccion(self, request, pk=None):
        """Aprobar solicitud como dirección"""
        solicitud = self.get_object()
        user = request.user
        
        # Verificar permisos (solo nivel 3 y 4)
        if user.rol.nivel < 3:
            return Response(
                {'error': 'No tienes permisos para aprobar esta solicitud'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validar estado
        if solicitud.estado != 'pendiente_direccion':
            return Response(
                {'error': 'Esta solicitud no está en estado pendiente de dirección'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = SolicitudAprobacionSerializer(data=request.data)
        if serializer.is_valid():
            if serializer.validated_data['aprobar']:
                solicitud.aprobar_direccion(
                    director=user,
                    comentarios=serializer.validated_data.get('comentarios', '')
                )
                return Response({
                    'message': 'Solicitud aprobada completamente',
                    'nuevo_estado': solicitud.estado,
                    'dias_actualizados': True
                })
            else:
                solicitud.rechazar_direccion(
                    director=user,
                    comentarios=serializer.validated_data.get('comentarios', '')
                )
                return Response({
                    'message': 'Solicitud rechazada por dirección',
                    'nuevo_estado': solicitud.estado
                })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Listar solicitudes pendientes de aprobación"""
        user = request.user
        
        if user.rol.nivel == 2:  # Jefatura
            solicitudes = Solicitud.objects.filter(
                usuario__area=user.area,
                estado='pendiente_jefatura'
            )
        elif user.rol.nivel >= 3:  # Dirección/Subdirección
            solicitudes = Solicitud.objects.filter(
                estado__in=['pendiente_jefatura', 'pendiente_direccion']
            )
        else:
            solicitudes = Solicitud.objects.none()
        
        serializer = SolicitudListSerializer(solicitudes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def mis_aprobaciones(self, request):
        """Listar solicitudes que YO aprobé o rechacé"""
        user = request.user
        
        if user.rol.nivel < 2:
            return Response(
                {'error': 'No tienes permisos para ver este historial'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Buscar donde el usuario aprobó/rechazó
        solicitudes = Solicitud.objects.filter(
            Q(jefatura_aprobador=user) | Q(direccion_aprobador=user)
        ).select_related('usuario', 'usuario__area', 'jefatura_aprobador', 'direccion_aprobador')
        
        serializer = SolicitudListSerializer(solicitudes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def historial_completo(self, request):
        """Listar TODAS las solicitudes aprobadas/rechazadas (solo Dirección/Subdirección)"""
        user = request.user
        
        if user.rol.nivel < 3:
            return Response(
                {'error': 'Solo Dirección y Subdirección pueden ver el historial completo'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Todas las solicitudes que NO estén pendientes
        solicitudes = Solicitud.objects.exclude(
            estado__in=['pendiente_jefatura', 'pendiente_direccion']
        ).select_related('usuario', 'usuario__area')
        
        serializer = SolicitudListSerializer(solicitudes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def mis_solicitudes(self, request):
        """Listar solicitudes del usuario actual"""
        solicitudes = Solicitud.objects.filter(usuario=request.user)
        serializer = SolicitudListSerializer(solicitudes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def descargar_pdf(self, request, pk=None):
        """Descargar PDF de solicitud aprobada"""
        from django.http import HttpResponse
        from .pdf_generator import generar_pdf_solicitud
        
        solicitud = self.get_object()
        
        # Verificar que la solicitud esté completamente aprobada
        if solicitud.estado != 'aprobada':
            return Response(
                {'error': 'Solo se puede descargar el PDF de solicitudes aprobadas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar que el usuario tenga permiso para descargar este PDF
        # El usuario puede descargar su propia solicitud, o si tiene permisos de jefatura/dirección
        if solicitud.usuario != request.user and not request.user.puede_aprobar_solicitud(solicitud):
            return Response(
                {'error': 'No tienes permisos para descargar este PDF'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Generar el PDF
        pdf_buffer = generar_pdf_solicitud(solicitud)
        
        # Preparar la respuesta HTTP
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        filename = f"solicitud_{solicitud.numero_solicitud}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response


# ======================================================
# LICENCIA MÉDICA VIEWSET
# ======================================================

# Ubicación: api_intranet/views.py

class LicenciaMedicaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión de licencias médicas.
    Implementa lógica de bandejas para Subdirección y flujo de aprobación robusto.
    """
    serializer_class = LicenciaMedicaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'usuario__area']
    search_fields = ['numero_licencia', 'usuario__nombre', 'usuario__rut']
    ordering_fields = ['fecha_inicio', 'creado_en']
    ordering = ['-creado_en']

    def get_queryset(self):
        user = self.request.user
        # Optimizamos la consulta con select_related
        qs = LicenciaMedica.objects.select_related('usuario', 'usuario__area', 'revisada_por')
        
        if user.rol.nivel >= 3: # Dirección y Subdirección
            return qs.all()
        elif user.rol.nivel == 2: # Jefatura
            return qs.filter(usuario__area=user.area)
        else: # Funcionario
            return qs.filter(usuario=user)

    def perform_create(self, serializer):
        """Al subir una licencia, se asigna automáticamente el usuario actual"""
        serializer.save(usuario=self.request.user)

    # --- ACCIÓN DE GESTIÓN (APROBAR/RECHAZAR) ---

    @action(detail=True, methods=['post'], url_path='gestionar-licencia')
    def gestionar(self, request, pk=None):
        """
        Acción para que Subdirección gestione la licencia.
        Usa los nuevos métodos del modelo para asegurar la auditoría.
        """
        licencia = self.get_object()
        user = request.user

        if user.rol.nivel < 3:
            return Response({"error": "No tiene permisos para gestionar licencias."}, status=403)

        nuevo_estado = request.data.get('nuevo_estado')
        comentarios = request.data.get('comentarios', '')

        try:
            if nuevo_estado == 'aprobada':
                licencia.aprobar(revisor=user, comentarios=comentarios)
            elif nuevo_estado == 'rechazada':
                licencia.rechazar(revisor=user, comentarios=comentarios)
            else:
                return Response({"error": "Estado no válido. Use 'aprobada' o 'rechazada'."}, status=400)
            
            return Response({
                "status": f"Licencia {nuevo_estado} correctamente",
                "revisor": user.get_nombre_completo()
            })
        except ValueError as e:
            return Response({"error": str(e)}, status=400)

    # --- BANDEJAS DE ENTRADA (Filtros para LicenciasAdminPage) ---

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Muestra solo lo que está esperando revisión"""
        if request.user.rol.nivel < 3:
            return Response({"error": "No autorizado"}, status=403)
        
        licencias = self.get_queryset().filter(estado='pendiente')
        serializer = self.get_serializer(licencias, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def mis_revisiones(self, request):
        """Muestra las licencias que YO he gestionado (incluye las mías de cualquier estado)"""
        if request.user.rol.nivel < 3:
            return Response({"error": "No autorizado"}, status=403)
            
        # Filtramos por el revisor actual
        licencias = self.get_queryset().filter(revisada_por=request.user)
        serializer = self.get_serializer(licencias, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def historial_completo(self, request):
        """Muestra todas las licencias que ya fueron procesadas por cualquier administrador"""
        if request.user.rol.nivel < 3:
            return Response({"error": "No autorizado"}, status=403)
        
        # Todo lo que NO sea pendiente es historial
        licencias = self.get_queryset().exclude(estado='pendiente')
        serializer = self.get_serializer(licencias, many=True)
        return Response(serializer.data)

    # --- VISTAS PARA EL FUNCIONARIO ---

    @action(detail=False, methods=['get'])
    def mis_licencias(self, request):
        """Historial personal del funcionario logueado"""
        licencias = LicenciaMedica.objects.filter(usuario=request.user)
        serializer = self.get_serializer(licencias, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def vigentes(self, request):
        """Licencias que están transcurriendo hoy (útil para dashboards)"""
        hoy = timezone.now().date()
        licencias = self.get_queryset().filter(
            estado='aprobada',
            fecha_inicio__lte=hoy,
            fecha_termino__gte=hoy
        )
        serializer = self.get_serializer(licencias, many=True)
        return Response(serializer.data)


# ======================================================
# ACTIVIDAD VIEWSET
# ======================================================

class ActividadViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de actividades"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo', 'activa', 'para_todas_areas']
    search_fields = ['titulo', 'descripcion']
    ordering = ['-fecha_inicio']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Actividad.objects.all()
        
        # Filtrar por áreas si no son para todas
        if not user.rol.nivel >= 3:  # Si no es dirección/subdirección
            queryset = queryset.filter(
                Q(para_todas_areas=True) | Q(areas_participantes=user.area)
            )
        
        return queryset.distinct()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ActividadListSerializer
        return ActividadDetailSerializer
    
    def perform_create(self, serializer):
        """Registrar quién creó la actividad"""
        serializer.save(creado_por=self.request.user)
    
    @action(detail=True, methods=['post'])
    def inscribirse(self, request, pk=None):
        """Inscribirse en una actividad"""
        actividad = self.get_object()
        user = request.user
        
        # Verificar cupos
        if not actividad.tiene_cupos_disponibles():
            return Response(
                {'error': 'No hay cupos disponibles'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar si ya está inscrito
        if InscripcionActividad.objects.filter(actividad=actividad, usuario=user).exists():
            return Response(
                {'error': 'Ya estás inscrito en esta actividad'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Inscribir
        inscripcion = InscripcionActividad.objects.create(
            actividad=actividad,
            usuario=user
        )
        
        return Response({
            'message': 'Inscripción exitosa',
            'inscripcion_id': inscripcion.id
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'])
    def desinscribirse(self, request, pk=None):
        """Desinscribirse de una actividad"""
        actividad = self.get_object()
        user = request.user
        
        try:
            inscripcion = InscripcionActividad.objects.get(actividad=actividad, usuario=user)
            inscripcion.delete()
            return Response({'message': 'Desinscripción exitosa'})
        except InscripcionActividad.DoesNotExist:
            return Response(
                {'error': 'No estás inscrito en esta actividad'},
                status=status.HTTP_404_NOT_FOUND
            )


# ======================================================
# ANUNCIO VIEWSET
# ======================================================

class AnuncioViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de anuncios"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'es_destacado', 'activo', 'visibilidad_roles']
    search_fields = ['titulo', 'contenido']
    ordering_fields = ['fecha_publicacion', 'prioridad']
    ordering = ['-fecha_publicacion', '-prioridad']
    
    def get_queryset(self):
        user = self.request.user
        nivel_usuario = user.rol.nivel
        queryset = Anuncio.objects.all()
        
        # Filtrar por áreas si no son para todas
        if nivel_usuario < 3:
            queryset = queryset.filter(
                Q(para_todas_areas=True) | Q(areas_destinatarias=user.area)
            )
        
        # Filtrar por visibilidad de roles
        if nivel_usuario < 3:  # Si no es Dirección/Subdirección
            if nivel_usuario == 1:  # Funcionario
                queryset = queryset.filter(
                    Q(visibilidad_roles='solo_funcionarios') |
                    Q(visibilidad_roles='funcionarios_y_jefatura')
                )
            elif nivel_usuario == 2:  # Jefatura
                queryset = queryset.filter(
                    Q(visibilidad_roles='solo_jefatura') |
                    Q(visibilidad_roles='funcionarios_y_jefatura')
                )
        # Si es nivel 3 o 4 (Dirección/Subdirección), ve todos los anuncios
        
        return queryset.distinct()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AnuncioListSerializer
        return AnuncioDetailSerializer
    
    def perform_create(self, serializer):
        """Registrar quién creó el anuncio"""
        serializer.save(creado_por=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Sobrescribir create para manejar adjuntos"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=True, methods=['post'])
    def subir_adjunto(self, request, pk=None):
        """Subir archivo adjunto a un anuncio"""
        anuncio = self.get_object()
        archivo = request.FILES.get('archivo')
        
        if not archivo:
            return Response(
                {'error': 'No se proporcionó archivo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear el adjunto
        adjunto = AdjuntoAnuncio.objects.create(
            anuncio=anuncio,
            nombre_archivo=archivo.name,
            archivo=archivo,
            tipo_archivo=archivo.content_type,
            tamano=archivo.size
        )
        
        serializer = AdjuntoAnuncioSerializer(adjunto)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def vigentes(self, request):
        """Listar anuncios vigentes"""
        anuncios = self.get_queryset().filter(activo=True)
        anuncios = [a for a in anuncios if a.esta_vigente()]
        serializer = self.get_serializer(anuncios, many=True)
        return Response(serializer.data)



# ======================================================
# DOCUMENTO VIEWSET
# ======================================================

class DocumentoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de documentos"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'categoria', 'publico', 'activo']
    search_fields = ['titulo', 'codigo_documento', 'descripcion']
    ordering_fields = ['subido_en', 'fecha_vigencia']
    ordering = ['-subido_en']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Documento.objects.select_related('categoria', 'subido_por').all()
        
        # Filtrar por permisos
        if not user.rol.nivel >= 3:
            queryset = queryset.filter(
                Q(publico=True) | Q(areas_con_acceso=user.area)
            )
        
        return queryset.distinct()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DocumentoListSerializer
        elif self.action == 'create':
            return DocumentoCreateSerializer
        return DocumentoDetailSerializer
    
    def create(self, request, *args, **kwargs):
        """Solo Dirección y Subdirección pueden crear documentos"""
        if request.user.rol.nivel < 3:
            return Response(
                {'error': 'No tienes permisos para subir documentos'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Solo Dirección y Subdirección pueden eliminar documentos"""
        if request.user.rol.nivel < 3:
            return Response(
                {'error': 'No tienes permisos para eliminar documentos'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """Registrar quién subió el documento"""
        serializer.save(subido_por=self.request.user)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Descargar archivo desde base de datos"""
        from django.http import HttpResponse
        import io
        
        documento = self.get_object()
        
        # Registrar descarga
        documento.descargas += 1
        documento.save(update_fields=['descargas'])
        
        if documento.storage_type == 'database':
            # Verificar que hay contenido
            if not documento.archivo_contenido:
                return Response(
                    {'error': 'El archivo no tiene contenido'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Servir archivo desde BD
            # Convertir memoryview a bytes si es necesario
            contenido = bytes(documento.archivo_contenido) if isinstance(documento.archivo_contenido, memoryview) else documento.archivo_contenido
            
            response = HttpResponse(
                contenido,
                content_type=documento.mime_type
            )
            response['Content-Disposition'] = f'inline; filename="{documento.nombre_archivo}"'
            response['Content-Length'] = len(contenido)
            response['Accept-Ranges'] = 'bytes'
            return response
        elif documento.storage_type == 's3':
            # Redirigir a S3
            from django.shortcuts import redirect
            return redirect(documento.archivo_url)
        else:
            return Response(
                {'error': 'Tipo de almacenamiento no soportado'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def descargar(self, request, pk=None):
        """Registrar descarga de documento (deprecated - usar download)"""
        documento = self.get_object()
        documento.descargas += 1
        documento.save()
        return Response({'message': 'Descarga registrada'})
    
    @action(detail=True, methods=['post'])
    def visualizar(self, request, pk=None):
        """Registrar visualización de documento"""
        documento = self.get_object()
        documento.visualizaciones += 1
        documento.save()
        return Response({'message': 'Visualización registrada'})


# ======================================================
# CATEGORÍA DOCUMENTO VIEWSET
# ======================================================

class CategoriaDocumentoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de categorías de documentos"""
    queryset = CategoriaDocumento.objects.all()
    serializer_class = CategoriaDocumentoSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['orden', 'nombre']


# ======================================================
# NOTIFICACIÓN VIEWSET
# ======================================================

class NotificacionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de notificaciones"""
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tipo', 'leida']
    ordering = ['-creada_en']
    
    def get_queryset(self):
        """Cada usuario ve solo sus notificaciones"""
        return Notificacion.objects.filter(usuario=self.request.user)
    
    @action(detail=True, methods=['post'])
    def marcar_leida(self, request, pk=None):
        """Marcar notificación como leída"""
        notificacion = self.get_object()
        notificacion.marcar_como_leida()
        return Response({'message': 'Notificación marcada como leída'})
    
    @action(detail=False, methods=['post'])
    def marcar_todas_leidas(self, request):
        """Marcar todas las notificaciones como leídas"""
        notificaciones = self.get_queryset().filter(leida=False)
        for notif in notificaciones:
            notif.marcar_como_leida()
        return Response({
            'message': f'{notificaciones.count()} notificaciones marcadas como leídas'
        })
    
    @action(detail=False, methods=['get'])
    def no_leidas(self, request):
        """Listar notificaciones no leídas"""
        notificaciones = self.get_queryset().filter(leida=False)
        serializer = self.get_serializer(notificaciones, many=True)
        return Response(serializer.data)


# ======================================================
# LOG AUDITORÍA VIEWSET
# ======================================================

class LogAuditoriaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet solo lectura para logs de auditoría"""
    serializer_class = LogAuditoriaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['accion', 'modelo', 'usuario']
    search_fields = ['descripcion', 'objeto_id']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        user = self.request.user
        
        # Solo dirección y subdirección pueden ver todos los logs
        if user.rol.nivel >= 3:
            return LogAuditoria.objects.select_related('usuario').all()
        
        # Otros usuarios solo ven sus propios logs
        return LogAuditoria.objects.filter(usuario=user)