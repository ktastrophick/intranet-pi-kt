# ======================================================
# DATOS INICIALES - Fixtures para Base de Datos
# Ubicación: backend/backend_intranet/api_intranet/management/commands/loadinitialdata.py
# ======================================================

from django.core.management.base import BaseCommand
from api_intranet.models import Rol, Area, Usuario, TipoContrato
from django.utils import timezone
from decimal import Decimal

class Command(BaseCommand):
    help = 'Crea tipos de contrato, roles, áreas y usuarios iniciales para el sistema'

    def handle(self, *args, **kwargs):
        self.stdout.write('Iniciando carga de datos...')
        
        # ======================================================
        # 1. CREAR TIPOS DE CONTRATO
        # ======================================================
        self.stdout.write('\n📄 Creando Tipos de Contrato...')
        
        contrato_planta, _ = TipoContrato.objects.get_or_create(
            nombre='Planta (Indefinido)',
            defaults={'descripcion': 'Personal con contrato de planta institucional.'}
        )
        contrato_contrata, _ = TipoContrato.objects.get_or_create(
            nombre='Contrata (Plazo Fijo)',
            defaults={'descripcion': 'Personal a contrata con renovación anual.'}
        )
        contrato_honorarios, _ = TipoContrato.objects.get_or_create(
            nombre='Honorarios',
            defaults={'descripcion': 'Personal externo bajo modalidad de honorarios.'}
        )
        self.stdout.write(f'  ✓ Creados: {contrato_planta.nombre}, {contrato_contrata.nombre}')

        # ======================================================
        # 2. CREAR ROLES
        # ======================================================
        self.stdout.write('\n📋 Creando Roles...')
        
        roles_config = [
            {
                'nombre': 'Dirección', 'nivel': 4, 
                'perms': {'puede_crear_usuarios': True, 'puede_eliminar_contenido': True, 'puede_aprobar_solicitudes': True, 'puede_gestionar_licencias': True}
            },
            {
                'nombre': 'Subdirección', 'nivel': 3, 
                'perms': {'puede_crear_usuarios': True, 'puede_aprobar_solicitudes': True, 'puede_subir_documentos': True, 'puede_gestionar_licencias': True}
            },
            {
                'nombre': 'Jefatura de Área', 'nivel': 2, 
                'perms': {'puede_aprobar_solicitudes': True, 'puede_ver_reportes': True}
            },
            {
                'nombre': 'Funcionario', 'nivel': 1, 
                'perms': {}
            },
        ]

        roles_creados = {}
        for r in roles_config:
            rol, _ = Rol.objects.get_or_create(
                nombre=r['nombre'],
                defaults={
                    'nivel': r['nivel'],
                    'puede_crear_usuarios': r['perms'].get('puede_crear_usuarios', False),
                    'puede_eliminar_contenido': r['perms'].get('puede_eliminar_contenido', False),
                    'puede_aprobar_solicitudes': r['perms'].get('puede_aprobar_solicitudes', False),
                    'puede_subir_documentos': r['perms'].get('puede_subir_documentos', False),
                    'puede_crear_actividades': True if r['nivel'] >= 3 else False,
                    'puede_crear_anuncios': True if r['nivel'] >= 3 else False,
                    'puede_gestionar_licencias': r['perms'].get('puede_gestionar_licencias', False),
                    'puede_ver_reportes': True if r['nivel'] >= 2 else False,
                    'puede_editar_calendario': True if r['nivel'] >= 3 else False,
                }
            )
            roles_creados[r['nombre']] = rol
            self.stdout.write(f'  ✓ {rol.nombre}')

        # ======================================================
        # 3. CREAR ÁREAS
        # ======================================================
        self.stdout.write('\n🏢 Creando Áreas...')
        
        areas_data = [
            {'nombre': 'Dirección', 'codigo': 'DIR-001', 'color': '#EF4444', 'icono': '🏛️'},
            {'nombre': 'Subdirección Administrativa', 'codigo': 'SDA-001', 'color': '#F59E0B', 'icono': '💼'},
            {'nombre': 'Subdirección Clínica', 'codigo': 'SDC-001', 'color': '#10B981', 'icono': '🏥'},
            {'nombre': 'Enfermería', 'codigo': 'ENF-001', 'color': '#06B6D4', 'icono': '🩹'},
            {'nombre': 'Administración', 'codigo': 'ADM-001', 'color': '#64748B', 'icono': '📊'},
        ]
        
        areas_creadas = {}
        for a in areas_data:
            area, _ = Area.objects.get_or_create(
                codigo=a['codigo'],
                defaults={'nombre': a['nombre'], 'color': a['color'], 'icono': a['icono']}
            )
            areas_creadas[a['nombre']] = area
            self.stdout.write(f'  ✓ {area.nombre}')

        # ======================================================
        # 4. CREAR USUARIOS INICIALES
        # ======================================================
        self.stdout.write('\n👥 Creando Usuarios...')

        # 4.1 Directora (Superuser)
        directora, created = Usuario.objects.get_or_create(
            rut='12.345.678-9',
            defaults={
                'email': 'directora@cesfam.cl',
                'nombre': 'María Elena',
                'apellido_paterno': 'González',
                'apellido_materno': 'Rojas',
                'cargo': 'Directora CESFAM',
                'area': areas_creadas['Dirección'],
                'rol': roles_creados['Dirección'],
                'tipo_contrato': contrato_planta,
                'fecha_ingreso': timezone.now().date(),
                'is_staff': True,
                'is_superuser': True,
                'es_jefe_de_area': True,
                'dias_vacaciones_disponibles': 25,
                'dias_administrativos_disponibles': Decimal('6.0'),
            }
        )
        if created:
            directora.set_password('admin123')
            directora.save()
            areas_creadas['Dirección'].jefe = directora
            areas_creadas['Dirección'].save()
            self.stdout.write(f'  ✓ {directora.get_nombre_completo()} (Directora)')

        # 4.2 Subdirectora Clínica
        sub_clinica, created = Usuario.objects.get_or_create(
            rut='14.567.890-1',
            defaults={
                'email': 'sub.clinica@cesfam.cl',
                'nombre': 'Ana',
                'apellido_paterno': 'Martínez',
                'apellido_materno': 'López',
                'cargo': 'Subdirectora Clínica',
                'area': areas_creadas['Subdirección Clínica'],
                'rol': roles_creados['Subdirección'],
                'tipo_contrato': contrato_planta,
                'fecha_ingreso': timezone.now().date(),
                'is_staff': True,
                'es_jefe_de_area': True,
                'dias_vacaciones_disponibles': 20,
                'dias_administrativos_disponibles': Decimal('6.0'),
            }
        )
        if created:
            sub_clinica.set_password('admin123')
            sub_clinica.save()
            areas_creadas['Subdirección Clínica'].jefe = sub_clinica
            areas_creadas['Subdirección Clínica'].save()
            self.stdout.write(f'  ✓ {sub_clinica.get_nombre_completo()} (Subdirectora Clínica)')

        # 4.3 Funcionario (Enfermería)
        enfermero, created = Usuario.objects.get_or_create(
            rut='16.789.012-3',
            defaults={
                'email': 'enfermero@cesfam.cl',
                'nombre': 'Lucía',
                'apellido_paterno': 'Torres',
                'apellido_materno': 'Ramírez',
                'cargo': 'Enfermera',
                'area': areas_creadas['Enfermería'],
                'rol': roles_creados['Funcionario'],
                'tipo_contrato': contrato_contrata,
                'fecha_ingreso': timezone.now().date(),
                'dias_vacaciones_disponibles': 15,
                'dias_administrativos_disponibles': Decimal('4.5'),
                'horas_devolucion_disponibles': Decimal('12.5'),
            }
        )
        if created:
            enfermero.set_password('user123')
            enfermero.save()
            self.stdout.write(f'  ✓ {enfermero.get_nombre_completo()} (Funcionario)')
        
        # 4.4 Jefatura de Área (Enfermería) - MODIFICADO
        jefe_enfermeria, created = Usuario.objects.get_or_create(
            rut='15.678.901-2',
            defaults={
                'email': 'jefe.enfermeria@cesfam.cl',
                'nombre': 'Ricardo',
                'apellido_paterno': 'Soto',
                'apellido_materno': 'Méndez',
                'cargo': 'Jefe de Enfermería',
                'area': areas_creadas['Enfermería'],
                'rol': roles_creados['Jefatura de Área'],
                'tipo_contrato': contrato_planta,
                'fecha_ingreso': timezone.now().date(),
                'es_jefe_de_area': True,
                'dias_vacaciones_disponibles': 20,
                'dias_administrativos_disponibles': Decimal('6.0'),
                'horas_devolucion_disponibles': Decimal('0.0'),
            }
        )
        if created:
            jefe_enfermeria.set_password('admin123')
            jefe_enfermeria.save()
            # Asignar como jefe oficial del objeto Area
            area_enf = areas_creadas['Enfermería']
            area_enf.jefe = jefe_enfermeria
            area_enf.save()
            self.stdout.write(f'  ✓ {jefe_enfermeria.get_nombre_completo()} (Jefe de Enfermería)')

        self.stdout.write(self.style.SUCCESS('\n✅ Proceso completado exitosamente!'))