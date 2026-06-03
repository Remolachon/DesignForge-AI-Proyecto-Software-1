import logging
import re
from email.utils import parseaddr
from html import escape

import requests

from app.config.settings import settings


logger = logging.getLogger(__name__)


class EmailService:
    BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email"
    EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    BRAND_NAME = "DesignForge AI"

    @staticmethod
    def _is_enabled() -> bool:
        return bool(settings.BREVO_API_KEY and settings.BREVO_EMAIL_FROM)

    @staticmethod
    def _sender_address() -> str:
        return (settings.BREVO_EMAIL_FROM or "").strip()

    @staticmethod
    def _sender_name() -> str:
        return EmailService.BRAND_NAME

    @staticmethod
    def _brand_name() -> str:
        return EmailService.BRAND_NAME

    @staticmethod
    def _frontend_url() -> str | None:
        if not settings.FRONTEND_URL:
            return None
        return settings.FRONTEND_URL.rstrip("/")

    @classmethod
    def _dashboard_url(cls) -> str | None:
        frontend_url = cls._frontend_url()
        if not frontend_url:
            return None
        return f"{frontend_url}/cliente/dashboard"

    @classmethod
    def _orders_url(cls) -> str | None:
        frontend_url = cls._frontend_url()
        if not frontend_url:
            return None
        return f"{frontend_url}/cliente/pedidos"

    @classmethod
    def _normalize_recipient(cls, email_address: str | None) -> str | None:
        if not email_address:
            return None

        candidate = parseaddr(str(email_address).strip())[1].strip().lower()
        if not candidate or not cls.EMAIL_PATTERN.match(candidate):
            return None
        return candidate

    @staticmethod
    def _safe_text(value: object | None, fallback: str = "") -> str:
        if value is None:
            return fallback
        text = str(value).strip()
        return text or fallback

    @classmethod
    def _base_subject(cls, subject: str) -> str:
        return f"{cls._brand_name()} | {subject}"

    @classmethod
    def _build_brevo_payload(
        cls,
        recipient_email: str,
        subject: str,
        plain_text: str,
        html_body: str,
    ) -> dict:
        return {
            "sender": {
                "name": cls._sender_name(),
                "email": cls._sender_address(),
            },
            "to": [
                {
                    "email": recipient_email,
                }
            ],
            "subject": subject,
            "textContent": plain_text,
            "htmlContent": html_body,
            "replyTo": {
                "email": cls._sender_address(),
                "name": cls._sender_name(),
            },
        }

    @classmethod
    def _wrap_html(cls, title: str, heading: str, body_html: str, cta_label: str | None = None, cta_url: str | None = None) -> str:
        brand = escape(cls._brand_name())
        safe_title = escape(title)
        safe_heading = escape(heading)
        cta_button = ""
        if cta_label and cta_url:
            cta_button = f'''
                <tr>
                    <td style="padding-top: 28px;">
                        <a href="{escape(cta_url)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:999px;">{escape(cta_label)}</a>
                    </td>
                </tr>
            '''

        return f"""<!DOCTYPE html>
<html lang=\"es\">
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
    <title>{safe_title}</title>
  </head>
  <body style=\"margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;\">
    <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#f5f7fb;padding:32px 16px;\">
      <tr>
        <td align=\"center\">
          <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:640px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);\">
            <tr>
              <td style=\"padding:28px 32px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#ffffff;\">
                <div style=\"font-size:14px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85;\">{brand}</div>
                <div style=\"font-size:26px;line-height:1.2;font-weight:700;margin-top:10px;\">{safe_heading}</div>
              </td>
            </tr>
            <tr>
              <td style=\"padding:32px;\">
                {body_html}
                {cta_button}
                <p style=\"margin:32px 0 0;font-size:14px;line-height:1.6;color:#64748b;\">
                  Este es un mensaje automático. Si necesitas ayuda, responde a este correo y con gusto te atenderemos.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""

    @classmethod
    def _send_message(cls, recipient_email: str | None, subject: str, plain_text: str, html_body: str) -> dict:
        normalized_recipient = cls._normalize_recipient(recipient_email)
        if not normalized_recipient:
            return {
                "status": "error",
                "error": "La dirección de correo del destinatario no es válida.",
            }

        if not cls._is_enabled():
            logger.warning("Correo no enviado porque la configuración de Brevo no está completa")
            return {
                "status": "disabled",
                "message": "La configuración de correo no está habilitada.",
            }

        try:
            payload = cls._build_brevo_payload(
                recipient_email=normalized_recipient,
                subject=cls._base_subject(subject),
                plain_text=plain_text,
                html_body=html_body,
            )

            response = requests.post(
                cls.BREVO_ENDPOINT,
                headers={
                    "accept": "application/json",
                    "api-key": settings.BREVO_API_KEY or "",
                    "content-type": "application/json",
                },
                json=payload,
                timeout=20,
            )

            if 200 <= response.status_code < 300:
                return {
                    "status": "sent",
                    "message": "Correo enviado correctamente.",
                }

            response_detail = ""
            try:
                response_data = response.json()
                response_detail = str(
                    response_data.get("message")
                    or response_data.get("code")
                    or response_data.get("error")
                    or ""
                ).strip()
            except ValueError:
                response_detail = response.text.strip()

            if response.status_code in {400, 422}:
                logger.warning(
                    "Brevo rechazó el destinatario %s: %s",
                    normalized_recipient,
                    response_detail or response.status_code,
                )
                return {
                    "status": "error",
                    "error": "La dirección de correo del destinatario no pudo ser aceptada por el proveedor de correo.",
                }

            if response.status_code in {401, 403}:
                logger.error("Error de autenticación Brevo")
                return {
                    "status": "error",
                    "error": "Brevo rechazó la autenticación. Verifica que BREVO_API_KEY sea válida y que el remitente esté configurado.",
                }

            logger.error(
                "Fallo Brevo al enviar correo. Status=%s Detail=%s",
                response.status_code,
                response_detail,
            )
            return {
                "status": "error",
                "error": "No fue posible enviar el correo en este momento.",
            }

        except requests.RequestException:
            logger.exception("Fallo de red al enviar correo con Brevo")
            return {
                "status": "error",
                "error": "No fue posible conectar con el proveedor de correo.",
            }

    @classmethod
    def send_welcome_email(cls, recipient_email: str, first_name: str | None = None) -> dict:
        safe_name = cls._safe_text(first_name, "cliente")
        subject = "Bienvenido a nuestra plataforma"
        plain_text = (
            f"Hola {safe_name}:\n\n"
            "Gracias por registrarte en DesignForge AI. Tu cuenta ya está activa y puedes comenzar a explorar nuestros servicios, crear pedidos y revisar el estado de tus compras desde tu panel.\n\n"
            "Si detectas alguna actividad que no reconozcas, responde a este correo para ayudarte de inmediato.\n\n"
            f"Equipo de {cls._brand_name()}"
        )
        html_body = cls._wrap_html(
            title=subject,
            heading="Tu cuenta ha sido creada con éxito",
            body_html=f"""
                <p style=\"margin:0 0 16px;font-size:16px;line-height:1.7;\">Hola {escape(safe_name)},</p>
                <p style=\"margin:0 0 16px;font-size:16px;line-height:1.7;\">Gracias por registrarte en DesignForge AI. Tu cuenta ya está activa y puedes comenzar a explorar nuestros servicios, crear pedidos y revisar tus compras desde tu panel.</p>
                <p style=\"margin:0;font-size:16px;line-height:1.7;\">Si detectas alguna actividad que no reconozcas, responde a este correo y te ayudaremos de inmediato.</p>
            """,
            cta_label="Ir a mi cuenta",
            cta_url=cls._frontend_url(),
        )
        return cls._send_message(recipient_email, subject, plain_text, html_body)

    @classmethod
    def send_order_created_email(
        cls,
        recipient_email: str,
        first_name: str | None,
        order_id: int,
        order_name: str,
        quantity: int,
        total_amount: float,
        payment_url: str | None = None,
    ) -> dict:
        safe_name = cls._safe_text(first_name, "cliente")
        safe_order_name = cls._safe_text(order_name, "tu pedido")
        safe_quantity = max(1, int(quantity or 1))
        safe_total = f"{float(total_amount or 0):,.2f} COP"
        subject = f"Hemos recibido tu pedido #{order_id}"
        plain_text = (
            f"Hola {safe_name}:\n\n"
            f"Confirmamos la recepción de tu pedido #{order_id} para {safe_order_name}.\n"
            f"Cantidad: {safe_quantity}\n"
            f"Valor total: {safe_total}\n\n"
            "Tu solicitud ya fue registrada y el proceso de pago está disponible para continuar con la compra.\n\n"
            f"Equipo de {cls._brand_name()}"
        )
        payment_link = payment_url or cls._frontend_url()
        html_body = cls._wrap_html(
            title=subject,
            heading=f"Pedido #{order_id} registrado",
            body_html=f"""
                <p style=\"margin:0 0 16px;font-size:16px;line-height:1.7;\">Hola {escape(safe_name)},</p>
                <p style=\"margin:0 0 16px;font-size:16px;line-height:1.7;\">Confirmamos la recepción de tu pedido <strong>#{order_id}</strong> para <strong>{escape(safe_order_name)}</strong>.</p>
                <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:24px 0;border-collapse:collapse;\">
                  <tr>
                    <td style=\"padding:12px 0;border-bottom:1px solid #e2e8f0;color:#64748b;\">Cantidad</td>
                    <td style=\"padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;\">{safe_quantity}</td>
                  </tr>
                  <tr>
                    <td style=\"padding:12px 0;border-bottom:1px solid #e2e8f0;color:#64748b;\">Valor total</td>
                    <td style=\"padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;\">{safe_total}</td>
                  </tr>
                </table>
                <p style=\"margin:0;font-size:16px;line-height:1.7;\">Tu solicitud ya fue registrada y el proceso de pago está disponible para continuar con la compra.</p>
            """,
            cta_label="Continuar al pago",
            cta_url=payment_link,
        )
        return cls._send_message(recipient_email, subject, plain_text, html_body)

    @classmethod
    def send_custom_order_created_email(
        cls,
        recipient_email: str,
        first_name: str | None,
        order_id: int,
        order_name: str,
        quantity: int,
        total_amount: float,
    ) -> dict:
        safe_name = cls._safe_text(first_name, "cliente")
        safe_order_name = cls._safe_text(order_name, "tu pedido personalizado")
        safe_quantity = max(1, int(quantity or 1))
        safe_total = f"{float(total_amount or 0):,.2f} COP"
        subject = f"Hemos recibido tu pedido personalizado #{order_id}"
        plain_text = (
            f"Hola {safe_name}:\n\n"
            f"Confirmamos la recepción de tu pedido personalizado #{order_id} para {safe_order_name}.\n"
            f"Cantidad: {safe_quantity}\n"
            f"Valor estimado: {safe_total}\n\n"
            "Tu solicitud quedó registrada y ahora permanece pendiente hasta que una empresa la acepte.\n\n"
            f"Equipo de {cls._brand_name()}"
        )
        html_body = cls._wrap_html(
            title=subject,
            heading=f"Pedido personalizado #{order_id} registrado",
            body_html=f"""
                <p style=\"margin:0 0 16px;font-size:16px;line-height:1.7;\">Hola {escape(safe_name)},</p>
                <p style=\"margin:0 0 16px;font-size:16px;line-height:1.7;\">Confirmamos la recepción de tu pedido personalizado <strong>#{order_id}</strong> para <strong>{escape(safe_order_name)}</strong>.</p>
                <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:24px 0;border-collapse:collapse;\">
                  <tr>
                    <td style=\"padding:12px 0;border-bottom:1px solid #e2e8f0;color:#64748b;\">Cantidad</td>
                    <td style=\"padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;\">{safe_quantity}</td>
                  </tr>
                  <tr>
                    <td style=\"padding:12px 0;border-bottom:1px solid #e2e8f0;color:#64748b;\">Valor estimado</td>
                    <td style=\"padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;\">{safe_total}</td>
                  </tr>
                </table>
                <p style=\"margin:0;font-size:16px;line-height:1.7;\">Tu solicitud quedó registrada y ahora permanece pendiente hasta que una empresa la acepte.</p>
            """,
            cta_label="Ir a mi dashboard",
            cta_url=cls._dashboard_url(),
        )
        return cls._send_message(recipient_email, subject, plain_text, html_body)

    @classmethod
    def send_order_accepted_email(
        cls,
        recipient_email: str,
        first_name: str | None,
        order_id: int,
        order_name: str,
        company_name: str,
    ) -> dict:
        safe_name = cls._safe_text(first_name, "cliente")
        safe_order = cls._safe_text(order_name, "tu pedido")
        safe_company = cls._safe_text(company_name, "la empresa asignada")
        subject = "Tu pedido personalizado fue aceptado"
        plain_text = (
            f"Hola {safe_name}:\n\n"
            f"Tu pedido #{order_id} ({safe_order}) fue aceptado por {safe_company}.\n"
            "Ya puedes revisarlo desde tu dashboard.\n\n"
            f"Equipo de {cls._brand_name()}"
        )
        html_body = cls._wrap_html(
            title=subject,
            heading="Tu pedido ya fue asignado",
            body_html=f"""
                <p style=\"margin:0 0 16px;font-size:16px;line-height:1.7;\">Hola {escape(safe_name)},</p>
                <p style=\"margin:0 0 16px;font-size:16px;line-height:1.7;\">Tu pedido <strong>#{order_id}</strong> ({escape(safe_order)}) fue aceptado por <strong>{escape(safe_company)}</strong>.</p>
                <p style=\"margin:0;font-size:16px;line-height:1.7;\">Ya puedes revisar el estado del pedido desde tu dashboard. Cuando quede habilitado para pago, verás la opción allí mismo.</p>
            """,
            cta_label="Ir al dashboard",
            cta_url=cls._dashboard_url(),
        )
        return cls._send_message(recipient_email, subject, plain_text, html_body)

    @classmethod
    def send_payment_confirmed_email(
        cls,
        recipient_email: str,
        first_name: str | None,
        order_id: int,
        order_name: str,
        total_amount: float,
    ) -> dict:
        safe_name = cls._safe_text(first_name, "cliente")
        safe_order_name = cls._safe_text(order_name, "tu pedido")
        safe_total = f"{float(total_amount or 0):,.2f} COP"
        subject = f"Pago confirmado para tu pedido #{order_id}"
        plain_text = (
            f"Hola {safe_name}:\n\n"
            f"Tu pago para el pedido #{order_id} de {safe_order_name} fue confirmado correctamente.\n"
            f"Valor aprobado: {safe_total}\n\n"
            "Nuestro equipo continuará con la preparación de tu pedido.\n\n"
            f"Equipo de {cls._brand_name()}"
        )
        html_body = cls._wrap_html(
            title=subject,
            heading=f"Pago confirmado de tu pedido #{order_id}",
            body_html=f"""
                <p style=\"margin:0 0 16px;font-size:16px;line-height:1.7;\">Hola {escape(safe_name)},</p>
                <p style=\"margin:0 0 16px;font-size:16px;line-height:1.7;\">Tu pago para el pedido <strong>#{order_id}</strong> de <strong>{escape(safe_order_name)}</strong> fue confirmado correctamente.</p>
                <p style=\"margin:0;font-size:16px;line-height:1.7;\"><strong>Valor aprobado:</strong> {escape(safe_total)}</p>
            """,
        )
        return cls._send_message(recipient_email, subject, plain_text, html_body)

    @classmethod
    def send_order_delivered_email(
        cls,
        recipient_email: str,
        first_name: str | None,
        order_id: int,
        order_name: str,
        product_id: int | None = None,
        include_review_cta: bool = True,
    ) -> dict:
        safe_name = cls._safe_text(first_name, "cliente")
        safe_order_name = cls._safe_text(order_name, "tu pedido")
        subject = f"Tu pedido #{order_id} ha sido entregado"
        review_url = None
        if include_review_cta and cls._frontend_url() and product_id is not None:
            review_url = f"{cls._frontend_url()}/marketplace/{product_id}?review=1"

        if include_review_cta:
            plain_text = (
                f"Hola {safe_name}:\n\n"
                f"Tu pedido #{order_id} de {safe_order_name} ya fue entregado.\n"
                "Si deseas compartir tu experiencia, puedes dejar una valoración desde tu panel.\n\n"
                f"Equipo de {cls._brand_name()}"
            )
            body_html = (
                f"""
                <p style=\"margin:0 0 16px;font-size:16px;line-height:1.7;\">Hola {escape(safe_name)},</p>
                <p style=\"margin:0 0 16px;font-size:16px;line-height:1.7;\">Tu pedido <strong>#{order_id}</strong> de <strong>{escape(safe_order_name)}</strong> ya fue entregado.</p>
                <p style=\"margin:0;font-size:16px;line-height:1.7;\">Si deseas compartir tu experiencia, puedes dejar una valoración desde tu panel.</p>
                """
            )
            cta_label = "Dejar valoración"
            cta_url = review_url or cls._frontend_url()
        else:
            plain_text = (
                f"Hola {safe_name}:\n\n"
                f"Tu pedido #{order_id} de {safe_order_name} ya fue entregado.\n"
                "Puedes revisar el detalle y el estado desde tu panel de pedidos.\n\n"
                f"Equipo de {cls._brand_name()}"
            )
            body_html = (
                f"""
                <p style=\"margin:0 0 16px;font-size:16px;line-height:1.7;\">Hola {escape(safe_name)},</p>
                <p style=\"margin:0 0 16px;font-size:16px;line-height:1.7;\">Tu pedido <strong>#{order_id}</strong> de <strong>{escape(safe_order_name)}</strong> ya fue entregado.</p>
                <p style=\"margin:0;font-size:16px;line-height:1.7;\">Puedes revisar el detalle y el estado desde tu panel de pedidos.</p>
                """
            )
            cta_label = "Ver mis pedidos"
            cta_url = cls._orders_url() or cls._dashboard_url()

        html_body = cls._wrap_html(
            title=subject,
            heading=f"Pedido #{order_id} entregado",
            body_html=body_html,
            cta_label=cta_label,
            cta_url=cta_url,
        )
        return cls._send_message(recipient_email, subject, plain_text, html_body)