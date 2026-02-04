# ======================================================
# DATOS INICIALES - Fixtures para Base de Datos
# Ubicación: backend/intranet/fixtures/initial_data.py
# Descripción: Script para crear roles, áreas y usuarios iniciales
# ======================================================

from django.core.management.base import BaseCommand
from api_intranet.models import Rol, Area, Usuario
from django.utils import timezone


class Command(BaseCommand):
    help = 'Crea roles, áreas y usuarios iniciales para el sistema'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creando datos iniciales...')
        
        # ======================================================
        # 1. CREAR ROLES
        # ======================================================
        
        self.stdout.write('\n📋 Creando Roles...')
        
        # Rol: Dirección (Nivel 4 - Máximo)
        rol_direccion, created = Rol.objects.get_or_create(
            nombre='Dirección',
            defaults={
                'descripcion': 'Dirección del CESFAM - Máximos privilegios',
                'nivel': 4,
                'puede_crear_usuarios': True,
                'puede_eliminar_contenido': True,
                'puede_aprobar_solicitudes': True,
                'puede_subir_documentos': True,
                'puede_crear_actividades': True,
                'puede_crear_anuncios': True,
                'puede_gestionar_licencias': True,
                'puede_ver_reportes': True,
                'puede_editar_calendario': True,
            }
        )
        self.stdout.write(f'  ✓ {rol_direccion.nombre}')
        
        # Rol: Subdirección Administrativa (Nivel 3)
        rol_subdir_admin, created = Rol.objects.get_or_create(
            nombre='Subdirección Administrativa',
            defaults={
                'descripcion': 'Subdirección Administrativa - Alto nivel de privilegios',
                'nivel': 3,
                'puede_crear_usuarios': True,
                'puede_eliminar_contenido': False,  # NO puede eliminar
                'puede_aprobar_solicitudes': True,
                'puede_subir_documentos': True,
                'puede_crear_actividades': True,
                'puede_crear_anuncios': True,
                'puede_gestionar_licencias': True,
                'puede_ver_reportes': True,
                'puede_editar_calendario': True,
            }
        )
        self.stdout.write(f'  ✓ {rol_subdir_admin.nombre}')
        
        # Rol: Subdirección Clínica (Nivel 3)
        rol_subdir_clinica, created = Rol.objects.get_or_create(
            nombre='Subdirección Clínica',
            defaults={
                'descripcion': 'Subdirección Clínica - Alto nivel de privilegios',
                'nivel': 3,
                'puede_crear_usuarios': True,
                'puede_eliminar_contenido': False,  # NO puede eliminar
                'puede_aprobar_solicitudes': True,
                'puede_subir_documentos': True,
                'puede_crear_actividades': True,
                'puede_crear_anuncios': True,
                'puede_gestionar_licencias': True,
                'puede_ver_reportes': True,
                'puede_editar_calendario': True,
            }
        )
        self.stdout.write(f'  ✓ {rol_subdir_clinica.nombre}')
        
        # Rol: Jefatura (Nivel 2)
        rol_jefatura, created = Rol.objects.get_or_create(
            nombre='Jefatura de Área',
            defaults={
                'descripcion': 'Jefe de Área - Puede aprobar solicitudes de su área',
                'nivel': 2,
                'puede_crear_usuarios': False,
                'puede_eliminar_contenido': False,
                'puede_aprobar_solicitudes': True,  # Solo de su área
                'puede_subir_documentos': False,
                'puede_crear_actividades': False,
                'puede_crear_anuncios': False,
                'puede_gestionar_licencias': False,
                'puede_ver_reportes': True,  # De su área
                'puede_editar_calendario': False,
            }
        )
        self.stdout.write(f'  ✓ {rol_jefatura.nombre}')
        
        # Rol: Funcionario (Nivel 1)
        rol_funcionario, created = Rol.objects.get_or_create(
            nombre='Funcionario',
            defaults={
                'descripcion': 'Funcionario del CESFAM - Privilegios básicos',
                'nivel': 1,
                'puede_crear_usuarios': False,
                'puede_eliminar_contenido': False,
                'puede_aprobar_solicitudes': False,
                'puede_subir_documentos': False,
                'puede_crear_actividades': False,
                'puede_crear_anuncios': False,
                'puede_gestionar_licencias': False,
                'puede_ver_reportes': False,
                'puede_editar_calendario': False,
            }
        )
        self.stdout.write(f'  ✓ {rol_funcionario.nombre}')
        
        # ======================================================
        # 2. CREAR ÁREAS
        # ======================================================
        
        self.stdout.write('\n🏢 Creando Áreas...')
        
        areas_data = [
            {
                'nombre': 'Dirección',
                'codigo': 'DIR-001',
                'descripcion': 'Dirección General del CESFAM',
                'color': '#EF4444',
                'icono': '🏛️'
            },
            {
                'nombre': 'Subdirección Administrativa',
                'codigo': 'SDA-001',
                'descripcion': 'Subdirección de Administración y Finanzas',
                'color': '#F59E0B',
                'icono': '💼'
            },
            {
                'nombre': 'Subdirección Clínica',
                'codigo': 'SDC-001',
                'descripcion': 'Subdirección de Servicios Clínicos',
                'color': '#10B981',
                'icono': '🏥'
            },
            {
                'nombre': 'Medicina General',
                'codigo': 'MED-001',
                'descripcion': 'Área de Medicina General y Consultas',
                'color': '#3B82F6',
                'icono': '🩺'
            },
            {
                'nombre': 'Enfermería',
                'codigo': 'ENF-001',
                'descripcion': 'Área de Enfermería y Curaciones',
                'color': '#06B6D4',
                'icono': '🩹'
            },
            {
                'nombre': 'Odontología',
                'codigo': 'ODO-001',
                'descripcion': 'Servicio Dental y Odontológico',
                'color': '#6366F1',
                'icono': '🦷'
            },
            {
                'nombre': 'Salud Mental',
                'codigo': 'PSI-001',
                'descripcion': 'Área de Psicología y Salud Mental',
                'color': '#8B5CF6',
                'icono': '🧠'
            },
            {
                'nombre': 'Kinesiología',
                'codigo': 'KIN-001',
                'descripcion': 'Servicio de Kinesiología y Rehabilitación',
                'color': '#F59E0B',
                'icono': '🏋️'
            },
            {
                'nombre': 'Nutrición',
                'codigo': 'NUT-001',
                'descripcion': 'Área de Nutrición y Dietética',
                'color': '#10B981',
                'icono': '🍎'
            },
            {
                'nombre': 'Farmacia',
                'codigo': 'FAR-001',
                'descripcion': 'Farmacia y Dispensación de Medicamentos',
                'color': '#F97316',
                'icono': '💊'
            },
            {
                'nombre': 'Laboratorio',
                'codigo': 'LAB-001',
                'descripcion': 'Laboratorio Clínico',
                'color': '#14B8A6',
                'icono': '🔬'
            },
            {
                'nombre': 'Administración',
                'codigo': 'ADM-001',
                'descripcion': 'Administración, RRHH y Finanzas',
                'color': '#64748B',
                'icono': '📊'
            },
        ]
        
        areas_creadas = {}
        for area_data in areas_data:
            area, created = Area.objects.get_or_create(
                codigo=area_data['codigo'],
                defaults={
                    'nombre': area_data['nombre'],
                    'descripcion': area_data['descripcion'],
                    'color': area_data['color'],
                    'icono': area_data['icono'],
                }
            )
            areas_creadas[area_data['nombre']] = area
            self.stdout.write(f'  ✓ {area.nombre} ({area.codigo})')
        
        # ======================================================
        # 3. CREAR USUARIOS INICIALES
        # ======================================================
        
        self.stdout.write('\n👥 Creando Usuarios Iniciales...')
        
        # Usuario 1: Directora
        directora, created = Usuario.objects.get_or_create(
            rut='12.345.678-9',
            defaults={
                'email': 'maria.gonzalez@cesfam.cl',
                'nombre': 'María Elena',
                'apellido_paterno': 'González',
                'apellido_materno': 'Rojas',
                'cargo': 'Directora CESFAM',
                'area': areas_creadas['Dirección'],
                'rol': rol_direccion,
                'telefono': '+56 9 8765 4321',
                'fecha_ingreso': timezone.now().date(),
                'is_staff': True,
                'is_superuser': True,
                'es_jefe_de_area': True,
                'dias_vacaciones_anuales': 25,
                'dias_vacaciones_disponibles': 25,
                'dias_administrativos_anuales': 6,
                'dias_administrativos_disponibles': 6,
            }
        )
        if created:
            directora.set_password('admin123')  # Cambiar en producción
            directora.save()
            self.stdout.write(f'  ✓ {directora.get_nombre_completo()} - Directora')
        
        # Asignar como jefe del área
        areas_creadas['Dirección'].jefe = directora
        areas_creadas['Dirección'].save()
        
        # Usuario 2: Subdirector Administrativo
        subdirector_admin, created = Usuario.objects.get_or_create(
            rut='13.456.789-0',
            defaults={
                'email': 'carlos.rodriguez@cesfam.cl',
                'nombre': 'Carlos',
                'apellido_paterno': 'Rodríguez',
                'apellido_materno': 'Silva',
                'cargo': 'Subdirector Administrativo',
                'area': areas_creadas['Subdirección Administrativa'],
                'rol': rol_subdir_admin,
                'telefono': '+56 9 7654 3210',
                'fecha_ingreso': timezone.now().date(),
                'is_staff': True,
                'es_jefe_de_area': True,
                'dias_vacaciones_anuales': 20,
                'dias_vacaciones_disponibles': 20,
                'dias_administrativos_anuales': 6,
                'dias_administrativos_disponibles': 6,
            }
        )
        if created:
            subdirector_admin.set_password('admin123')
            subdirector_admin.save()
            self.stdout.write(f'  ✓ {subdirector_admin.get_nombre_completo()} - Subdirector Administrativo')
        
        areas_creadas['Subdirección Administrativa'].jefe = subdirector_admin
        areas_creadas['Subdirección Administrativa'].save()
        
        # Usuario 3: Subdirectora Clínica
        subdirectora_clinica, created = Usuario.objects.get_or_create(
            rut='14.567.890-1',
            defaults={
                'email': 'ana.martinez@cesfam.cl',
                'nombre': 'Ana',
                'apellido_paterno': 'Martínez',
                'apellido_materno': 'López',
                'cargo': 'Subdirectora Clínica',
                'area': areas_creadas['Subdirección Clínica'],
                'rol': rol_subdir_clinica,
                'telefono': '+56 9 6543 2109',
                'fecha_ingreso': timezone.now().date(),
                'is_staff': True,
                'es_jefe_de_area': True,
                'dias_vacaciones_anuales': 20,
                'dias_vacaciones_disponibles': 20,
                'dias_administrativos_anuales': 6,
                'dias_administrativos_disponibles': 6,
            }
        )
        if created:
            subdirectora_clinica.set_password('admin123')
            subdirectora_clinica.save()
            self.stdout.write(f'  ✓ {subdirectora_clinica.get_nombre_completo()} - Subdirectora Clínica')
        
        areas_creadas['Subdirección Clínica'].jefe = subdirectora_clinica
        areas_creadas['Subdirección Clínica'].save()
        
        # Usuario 4: Jefe de Enfermería
        jefe_enfermeria, created = Usuario.objects.get_or_create(
            rut='15.678.901-2',
            defaults={
                'email': 'patricia.fernandez@cesfam.cl',
                'nombre': 'Patricia',
                'apellido_paterno': 'Fernández',
                'apellido_materno': 'Muñoz',
                'cargo': 'Jefa de Enfermería',
                'area': areas_creadas['Enfermería'],
                'rol': rol_jefatura,
                'telefono': '+56 9 5432 1098',
                'fecha_ingreso': timezone.now().date(),
                'es_jefe_de_area': True,
                'dias_vacaciones_anuales': 15,
                'dias_vacaciones_disponibles': 15,
                'dias_administrativos_anuales': 6,
                'dias_administrativos_disponibles': 6,
            }
        )
        if created:
            jefe_enfermeria.set_password('jefe123')
            jefe_enfermeria.save()
            self.stdout.write(f'  ✓ {jefe_enfermeria.get_nombre_completo()} - Jefa de Enfermería')
        
        areas_creadas['Enfermería'].jefe = jefe_enfermeria
        areas_creadas['Enfermería'].save()
        
        # Usuario 5: Funcionario de Enfermería
        enfermera, created = Usuario.objects.get_or_create(
            rut='16.789.012-3',
            defaults={
                'email': 'lucia.torres@cesfam.cl',
                'nombre': 'Lucía',
                'apellido_paterno': 'Torres',
                'apellido_materno': 'Ramírez',
                'cargo': 'Enfermera',
                'area': areas_creadas['Enfermería'],
                'rol': rol_funcionario,
                'telefono': '+56 9 4321 0987',
                'fecha_ingreso': timezone.now().date(),
                'dias_vacaciones_anuales': 15,
                'dias_vacaciones_disponibles': 10,  # Ya usó 5
                'dias_vacaciones_usados': 5,
                'dias_administrativos_anuales': 6,
                'dias_administrativos_disponibles': 4,  # Ya usó 2
                'dias_administrativos_usados': 2,
            }
        )
        if created:
            enfermera.set_password('user123')
            enfermera.save()
            self.stdout.write(f'  ✓ {enfermera.get_nombre_completo()} - Enfermera')
        
        self.stdout.write(self.style.SUCCESS('\n✅ Datos iniciales creados exitosamente!'))
        self.stdout.write('\n📝 Credenciales por defecto:')
        self.stdout.write('  Dirección: 12.345.678-9 / admin123')
        self.stdout.write('  Subdirección Admin: 13.456.789-0 / admin123')
        self.stdout.write('  Subdirección Clínica: 14.567.890-1 / admin123')
        self.stdout.write('  Jefatura: 15.678.901-2 / jefe123')
        self.stdout.write('  Funcionario: 16.789.012-3 / user123')
        self.stdout.write(self.style.WARNING('\n⚠️  IMPORTANTE: Cambiar las contraseñas en producción!'))
