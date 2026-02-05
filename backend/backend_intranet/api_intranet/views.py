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
    Usuario, Rol, Area, Solicitud,TipoContrato,
    LicenciaMedica, Actividad, InscripcionActividad,
    Anuncio, AdjuntoAnuncio, Documento, CategoriaDocumento,
    Notificacion, LogAuditoria
)

from .serializers import (
    UsuarioListSerializer, UsuarioDetailSerializer, UsuarioCreateSerializer,
    RolSerializer, AreaSerializer, TipoContratoSerializer,
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
# TIPO CONTRATO VIEWSET
# ======================================================

class TipoContratoViewSet(viewsets.ModelViewSet):
    """Gestión de tipos de contrato (Dirección/Subdirección)"""
    queryset = TipoContrato.objects.all()
    serializer_class = TipoContratoSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if request.user.rol.nivel < 3:
            return Response({'error': 'No tiene permisos'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)


# ======================================================
# USUARIO VIEWSET
# ======================================================

class UsuarioViewSet(viewsets.ModelViewSet):
    """Gestión de usuarios y sus saldos de días"""
    queryset = Usuario.objects.select_related('rol', 'area', 'tipo_contrato').all()
    serializer_class = UsuarioDetailSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['area', 'rol', 'is_active', 'es_jefe_de_area']
    search_fields = ['nombre', 'apellido_paterno', 'apellido_materno', 'rut', 'email']
    ordering = ['apellido_paterno', 'nombre']
    
    def get_serializer_class(self):
        if self.action == 'list': return UsuarioListSerializer
        if self.action == 'create': return UsuarioCreateSerializer
        return UsuarioDetailSerializer
    
    @action(detail=True, methods=['get'])
    def dias_disponibles(self, request, pk=None):
        """Resumen de bolsas de tiempo"""
        usuario = self.get_object()
        return Response({
            'vacaciones': usuario.dias_vacaciones_disponibles,
            'administrativos': usuario.dias_administrativos_disponibles,
            'sin_goce': usuario.dias_sin_goce_acumulados,
            'devolucion': usuario.horas_devolucion_disponibles
        })
    
    @action(detail=False, methods=['get'])
    def me(self, request):
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
    queryset = Area.objects.select_related('jefe').all()
    serializer_class = AreaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'codigo']
    ordering = ['nombre']


# ======================================================
# SOLICITUD VIEWSET - CORREGIDO
# ======================================================

class SolicitudViewSet(viewsets.ModelViewSet):
    """Flujo de aprobación y anulación de solicitudes"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'estado', 'usuario__area']
    search_fields = ['numero_solicitud', 'usuario__nombre', 'usuario__rut']
    
    def get_queryset(self):
        user = self.request.user
        if user.rol.nivel >= 3: return Solicitud.objects.all()
        if user.rol.nivel == 2: return Solicitud.objects.filter(usuario__area=user.area)
        return Solicitud.objects.filter(usuario=user)

    def get_serializer_class(self):
        # ✅ FIX: 'mis_solicitudes' ahora usa ListSerializer para enviar nombres de jefes en vez de IDs
        if self.action in ['list', 'mis_solicitudes']: 
            return SolicitudListSerializer
        if self.action == 'create': 
            return SolicitudCreateSerializer
        return SolicitudDetailSerializer
    
    @action(detail=False, methods=['get'])
    def mis_solicitudes(self, request):
        """Endpoint: /api/solicitudes/mis_solicitudes/"""
        # ✅ OPTIMIZACIÓN: select_related evita múltiples consultas a la DB para traer los nombres
        solicitudes = Solicitud.objects.filter(usuario=request.user)\
            .select_related('jefatura_aprobador', 'direccion_aprobador', 'usuario__area')\
            .order_by('-creada_en')
        
        serializer = self.get_serializer(solicitudes, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    @action(detail=True, methods=['post'])
    def aprobar_jefatura(self, request, pk=None):
        solicitud = self.get_object()
        if request.user.rol.nivel < 2: return Response(status=403)
        
        serializer = SolicitudAprobacionSerializer(data=request.data)
        if serializer.is_valid():
            if serializer.validated_data['aprobar']:
                solicitud.aprobar(aprobador=request.user, comentarios=serializer.validated_data.get('comentarios', ''))
            else:
                solicitud.estado = 'rechazada'
                solicitud.comentarios_administracion = serializer.validated_data.get('comentarios', '')
                solicitud.save()
            return Response({'status': 'procesado'})
        return Response(serializer.errors, status=400)

    @action(detail=True, methods=['post'])
    def aprobar_direccion(self, request, pk=None):
        solicitud = self.get_object()
        if request.user.rol.nivel < 3: return Response(status=403)

        serializer = SolicitudAprobacionSerializer(data=request.data)
        if serializer.is_valid():
            if serializer.validated_data['aprobar']:
                solicitud.aprobar(aprobador=request.user, comentarios=serializer.validated_data.get('comentarios', ''))
            else:
                solicitud.estado = 'rechazada'
                solicitud.comentarios_administracion = serializer.validated_data.get('comentarios', '')
                solicitud.save()
            return Response({'status': 'procesado'})
        return Response(serializer.errors, status=400)

    @action(detail=True, methods=['post'])
    def anular_usuario(self, request, pk=None):
        solicitud = self.get_object()
        if solicitud.usuario != request.user: return Response(status=403)
        solicitud.anular_por_usuario()
        return Response({'status': 'anulada'})

    @action(detail=True, methods=['post'])
    def solicitar_anulacion_licencia(self, request, pk=None):
        solicitud = self.get_object()
        if solicitud.usuario != request.user: return Response(status=403)
        solicitud.solicitar_anulacion_licencia()
        return Response({'status': 'solicitada'})

    @action(detail=True, methods=['post'])
    def finalizar_anulacion_licencia(self, request, pk=None):
        """Dirección confirma anulación. Restitución de días es manual en Perfil Usuario."""
        solicitud = self.get_object()
        if request.user.rol.nivel < 3: return Response(status=403)
        solicitud.estado = 'anulada_por_licencia'
        solicitud.save()
        return Response({'message': 'Solicitud anulada por licencia. Ajuste los días manualmente.'})

    @action(detail=True, methods=['get'])
    def descargar_pdf(self, request, pk=None):
        solicitud = self.get_object()
        
        # Solo permitimos descargar si está aprobada
        if solicitud.estado != 'aprobada':
            return Response(
                {'error': 'La solicitud aún no ha sido aprobada completamente.'}, 
                status=400
            )
        
        try:
            buffer = generar_pdf_solicitud(solicitud)
            return FileResponse(
                buffer, 
                as_attachment=True, 
                filename=f'Solicitud_{solicitud.numero_solicitud}.pdf',
                content_type='application/pdf'
            )
        except Exception as e:
            return Response({'error': str(e)}, status=500)

# ======================================================
# LICENCIA MÉDICA VIEWSET
# ======================================================

# Ubicación: api_intranet/views.py


class LicenciaMedicaViewSet(viewsets.ModelViewSet):
    queryset = LicenciaMedica.objects.select_related('usuario', 'revisada_por').all()
    serializer_class = LicenciaMedicaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Dirección/Subdir ven todo
        if user.rol.nivel >= 3: return self.queryset
        # Jefatura ve su área
        if user.rol.nivel == 2: return self.queryset.filter(usuario__area=user.area)
        # Funcionario solo lo suyo
        return self.queryset.filter(usuario=user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    @action(detail=True, methods=['post'])
    def gestionar(self, request, pk=None):
        licencia = self.get_object()
        if request.user.rol.nivel < 3: return Response(status=403)
        
        estado = request.data.get('nuevo_estado')
        if estado == 'aprobada':
            licencia.aprobar(revisor=request.user, comentarios=request.data.get('comentarios', ''))
        elif estado == 'rechazada':
            licencia.rechazar(revisor=request.user, comentarios=request.data.get('comentarios', ''))
        return Response({'status': estado})


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