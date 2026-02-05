# ======================================================
# PDF GENERATOR - Generación de PDFs para Solicitudes
# Ubicación: api_intranet/pdf_generator.py
# ======================================================

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from io import BytesIO
from datetime import datetime

class SolicitudPDFGenerator:
    """
    Generador de PDFs para solicitudes de vacaciones y días administrativos aprobadas.
    """
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Configurar estilos personalizados"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=18,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=8,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=colors.black,
            alignment=TA_JUSTIFY,
            spaceAfter=6
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomSmall',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#4b5563'),
            alignment=TA_LEFT
        ))
    
    def _format_rut(self, rut):
        return rut
    
    def _format_date(self, date):
        """Formatea fecha de objeto date o string"""
        if isinstance(date, str):
            try:
                date = datetime.fromisoformat(date.replace('Z', '+00:00'))
            except:
                return date
        return date.strftime('%d/%m/%Y')
    
    def _format_datetime(self, dt):
        """Formatea datetime de objeto o string"""
        if isinstance(dt, str):
            try:
                dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
            except:
                return dt
        return dt.strftime('%d/%m/%Y %H:%M')
    
    def generate_solicitud_pdf(self, solicitud):
        """
        Genera un PDF para una solicitud aprobada.
        """
        buffer = BytesIO()
        
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72,
        )
        
        story = []
        
        # HEADER / TÍTULO
        story.append(Paragraph(
            f"SOLICITUD DE {solicitud.get_tipo_display().upper()}",
            self.styles['CustomTitle']
        ))
        story.append(Spacer(1, 0.2*inch))
        
        # INFORMACIÓN DEL DOCUMENTO
        # FIX: Se usa creada_en en lugar de fecha_solicitud
        info_doc = [
            ['Número de Solicitud:', solicitud.numero_solicitud],
            ['Estado:', 'APROBADA'],
            ['Fecha de Solicitud:', self._format_datetime(solicitud.creada_en)],
        ]
        
        info_table = Table(info_doc, colWidths=[2.5*inch, 3.5*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.3*inch))
        
        # DATOS DEL SOLICITANTE
        story.append(Paragraph("DATOS DEL SOLICITANTE", self.styles['CustomHeading']))
        
        datos_solicitante = [
            ['Nombre Completo:', solicitud.usuario.get_nombre_completo()],
            ['RUT:', solicitud.usuario.rut],
            ['Cargo:', solicitud.usuario.cargo],
            ['Área:', solicitud.usuario.area.nombre],
            ['Email:', solicitud.usuario.email],
            ['Teléfono:', solicitud.telefono_contacto],
        ]
        
        sol_table = Table(datos_solicitante, colWidths=[2.5*inch, 3.5*inch])
        sol_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#eff6ff')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#bfdbfe')),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(sol_table)
        story.append(Spacer(1, 0.3*inch))
        
        # DETALLE DE LA SOLICITUD
        story.append(Paragraph("DETALLE DE LA SOLICITUD", self.styles['CustomHeading']))
        
        detalle_solicitud = [
            ['Tipo de Permiso:', solicitud.get_tipo_display()],
            ['Fecha de Inicio:', self._format_date(solicitud.fecha_inicio)],
            ['Fecha de Término:', self._format_date(solicitud.fecha_termino)],
            ['Cantidad Solicitada:', f"{solicitud.cantidad_dias} {'Días' if solicitud.tipo != 'devolucion_tiempo' else 'Horas'}"],
        ]
        
        det_table = Table(detalle_solicitud, colWidths=[2.5*inch, 3.5*inch])
        det_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0fdf4')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#bbf7d0')),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(det_table)
        
        if solicitud.motivo:
            story.append(Spacer(1, 0.1*inch))
            story.append(Paragraph(f"<b>Motivo:</b> {solicitud.motivo}", self.styles['CustomBody']))

        story.append(Spacer(1, 0.3*inch))
        
        # APROBACIONES
        story.append(Paragraph("HISTORIAL DE APROBACIONES", self.styles['CustomHeading']))
        
        # Bloque Jefatura
        if solicitud.jefatura_aprobador:
            story.append(Paragraph("<b>Visto Bueno Jefatura Directa</b>", self.styles['CustomBody']))
            jef_data = [
                ['Aprobado por:', solicitud.jefatura_aprobador.get_nombre_completo()],
                ['Fecha:', self._format_datetime(solicitud.fecha_aprobacion_jefatura)],
            ]
            jef_table = Table(jef_data, colWidths=[2.5*inch, 3.5*inch])
            jef_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#fff7ed')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#ffedd5')),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
            ]))
            story.append(jef_table)
            story.append(Spacer(1, 0.1*inch))
        
        # Bloque Dirección
        if solicitud.direccion_aprobador:
            story.append(Paragraph("<b>Resolución Dirección / Subdirección</b>", self.styles['CustomBody']))
            dir_data = [
                ['Aprobado por:', solicitud.direccion_aprobador.get_nombre_completo()],
                ['Fecha:', self._format_datetime(solicitud.fecha_aprobacion_direccion)],
            ]
            dir_table = Table(dir_data, colWidths=[2.5*inch, 3.5*inch])
            dir_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0fdfa')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#ccfbf1')),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
            ]))
            story.append(dir_table)
            
        # Comentarios Finales (Cualquier rol)
        if solicitud.comentarios_administracion:
            story.append(Spacer(1, 0.2*inch))
            story.append(Paragraph("<b>Observaciones de la resolución:</b>", self.styles['CustomBody']))
            story.append(Paragraph(solicitud.comentarios_administracion, self.styles['CustomBody']))
        
        # PIE DE PÁGINA
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph(
            f"Documento generado automáticamente el {datetime.now().strftime('%d/%m/%Y %H:%M')}",
            self.styles['CustomSmall']
        ))
        
        doc.build(story)
        buffer.seek(0)
        return buffer

def generar_pdf_solicitud(solicitud):
    generator = SolicitudPDFGenerator()
    return generator.generate_solicitud_pdf(solicitud)