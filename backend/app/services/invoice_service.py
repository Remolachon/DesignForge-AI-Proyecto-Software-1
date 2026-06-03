import io
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor

class InvoiceService:
    @staticmethod
    def generate_invoice_pdf(order_detail: dict) -> io.BytesIO:
        """
        Generates a PDF invoice for the given order_detail dict
        and returns it as a BytesIO object.
        """
        buffer = io.BytesIO()
        # Ampliamos ligeramente los márgenes para darle "respiro" al diseño
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
        
        # --- DEFINICIÓN DE COLORES CORPORATIVOS (MODO CLARO) ---
        color_primary = HexColor("#0F172A")    # Azul pizarra oscuro para textos principales
        color_secondary = HexColor("#475569")  # Gris medio para textos secundarios
        color_accent = HexColor("#06B6D4")     # Cyan/Turquesa basado en tus botones
        color_bg_table = HexColor("#F8FAFC")   # Gris muy claro para encabezados de tabla
        color_border = HexColor("#E2E8F0")     # Gris claro para líneas divisorias

        # --- ESTILOS DE PÁRRAFO ---
        styles = getSampleStyleSheet()
        
        # Estilo normal personalizado
        style_normal = ParagraphStyle(
            name='CustomNormal', 
            parent=styles['Normal'], 
            fontName='Helvetica', 
            fontSize=10, 
            textColor=color_secondary,
            leading=14 # Interlineado
        )
        
        # Estilos para alineación a la derecha
        style_right = ParagraphStyle(
            name='RightAlign', 
            parent=style_normal, 
            alignment=2
        )
        
        # Estilo para totales
        style_total = ParagraphStyle(
            name='TotalStyle', 
            parent=styles['Normal'], 
            fontName='Helvetica-Bold', 
            fontSize=14, 
            textColor=color_primary,
            alignment=2
        )

        Story = []
        
        # --- DATOS DEL PEDIDO ---
        company_name = order_detail.get('companyName') or "LukArt"
        invoice_id = order_detail.get('id', 'N/A')
        date_str = datetime.datetime.now().strftime("%Y-%m-%d")
        client_name = order_detail.get('clientName') or "Cliente General"
        
        title = order_detail.get('title', 'Producto')
        quantity = order_detail.get('quantity', 1)
        price = order_detail.get('price', 0.0)
        total_amount = price * quantity

        # --- BLOQUE 1: CABECERA (Empresa e ID Factura) ---
        header_left = f"<font color='{color_accent}' size='22'><b>{company_name}</b></font><br/><font color='{color_secondary}' size='10'>Lukart - DesignForge AI</font>"
        header_right = f"<font color='{color_primary}' size='18'><b>FACTURA</b></font><br/><font color='{color_secondary}' size='10'>#{invoice_id}</font>"
        
        header_table = Table([
            [Paragraph(header_left, style_normal), Paragraph(header_right, style_right)]
        ], colWidths=[3.5 * inch, 3.5 * inch])
        
        # Alineamos el contenido de la cabecera arriba
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        Story.append(header_table)
        Story.append(Spacer(1, 0.4 * inch))

        # --- BLOQUE 2: INFORMACIÓN DEL CLIENTE Y FECHA ---
        info_left = f"<b>Facturado a:</b><br/><font color='{color_primary}'>{client_name}</font>"
        info_right = f"<b>Fecha de Emisión:</b><br/><font color='{color_primary}'>{date_str}</font>"
        
        info_table = Table([
            [Paragraph(info_left, style_normal), Paragraph(info_right, style_right)]
        ], colWidths=[3.5 * inch, 3.5 * inch])
        
        info_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        Story.append(info_table)
        Story.append(Spacer(1, 0.6 * inch))

        # --- BLOQUE 3: TABLA DE PRODUCTOS ---
        data = [
            ['Descripción', 'Cantidad', 'Precio Unitario', 'Total'],
            [title, str(quantity), f"${price:,.2f}", f"${(price * quantity):,.2f}"]
        ]
        
        # Anchos de columna optimizados
        t = Table(data, colWidths=[3.5 * inch, 1 * inch, 1.25 * inch, 1.25 * inch])
        t.setStyle(TableStyle([
            # Estilos del encabezado de la tabla
            ('BACKGROUND', (0, 0), (-1, 0), color_bg_table),
            ('TEXTCOLOR', (0, 0), (-1, 0), color_primary),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            
            # Estilos del contenido
            ('TEXTCOLOR', (0, 1), (-1, -1), color_secondary),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 12),
            ('TOPPADDING', (0, 1), (-1, -1), 12),
            
            # Alineaciones (Izquierda para descripción, Centro/Derecha para números)
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
            
            # Bordes: Solo líneas horizontales sutiles, sin la cuadrícula negra gruesa
            ('LINEBELOW', (0, 0), (-1, 0), 1.5, color_primary), # Línea un poco más fuerte bajo el título
            ('LINEBELOW', (0, 1), (-1, -1), 0.5, color_border), # Líneas tenues separadoras de filas
        ]))
        
        Story.append(t)
        Story.append(Spacer(1, 0.5 * inch))

        # --- BLOQUE 4: TOTALES ---
        total_text = f"<b>Total a Pagar:</b> ${total_amount:,.2f}"
        Story.append(Paragraph(total_text, style_total))
        Story.append(Spacer(1, 1 * inch))

        # --- BLOQUE 5: FOOTER (Mensaje de agradecimiento) ---
        footer_style = ParagraphStyle(
            name='Footer', 
            parent=style_normal, 
            alignment=1, # Centrado
            textColor=color_secondary,
            fontSize=9
        )
        Story.append(Paragraph("¡Gracias por tu compra y por confiar en LukArt - DesignForge AI!", footer_style))
        
        # Construir PDF
        doc.build(Story)
        buffer.seek(0)
        return buffer