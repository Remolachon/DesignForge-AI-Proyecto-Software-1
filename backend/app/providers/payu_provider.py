import hashlib
from datetime import datetime
from urllib.parse import urlencode

from app.config.settings import settings


class PayUProvider:
    """
    Proveedor para integración con PayU WebCheckout Sandbox.
    Maneja todo lo relacionado con generación de URLs de pago y validación de webhooks.
    """

    # URLs de PayU Sandbox
    BASE_URL_SANDBOX = "https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/"
    API_URL_SANDBOX = "https://sandbox.api.payulatam.com/payments-api/4.0/service.json"
    
    # URLs de PayU Producción
    BASE_URL_PRODUCTION = "https://checkout.payulatam.com/ppp-web-gateway-payu/"
    API_URL_PRODUCTION = "https://api.payulatam.com/payments-api/4.0/service.json"

    def __init__(self):
        self.merchant_id = settings.PAYU_MERCHANT_ID
        self.account_id = settings.PAYU_ACCOUNT_ID
        self.api_key = settings.PAYU_API_KEY
        self.api_login = settings.PAYU_API_LOGIN
        self.sandbox_mode = settings.PAYU_SANDBOX_MODE
        self.webhook_url = settings.PAYU_WEBHOOK_URL
        self.response_url = settings.PAYU_RESPONSE_URL
        
        self.base_url = self.BASE_URL_SANDBOX if self.sandbox_mode else self.BASE_URL_PRODUCTION
        self.api_url = self.API_URL_SANDBOX if self.sandbox_mode else self.API_URL_PRODUCTION

    def _generate_signature(self, merchant_id: str, reference_code: str, amount: str, currency: str, api_key: str) -> str:
        """
        Genera la firma MD5 necesaria para PayU WebCheckout.
        Formato: MD5(apiKey~merchantId~referenceCode~amount~currency)
        """
        signature_string = f"{api_key}~{merchant_id}~{reference_code}~{amount}~{currency}"
        signature = hashlib.md5(signature_string.encode()).hexdigest()
        return signature

    def _generate_payment_signature(self, api_key: str, merchant_id: str, transaction_id: str, state: str, response_code_pol: str, reference_code: str, amount: str, currency: str) -> str:
        """
        Genera la firma para validar las respuestas de PayU.
        Formato: MD5(apiKey~merchantId~transactionId~state~responseCodePol~referenceCode~amount~currency)
        """
        signature_string = f"{api_key}~{merchant_id}~{transaction_id}~{state}~{response_code_pol}~{reference_code}~{amount}~{currency}"
        signature = hashlib.md5(signature_string.encode()).hexdigest()
        return signature

    def generate_payment_url(
        self,
        order_id: int,
        user_email: str,
        total_amount: float,
        buyer_name: str,
        tax_amount: float | None = None,
        tax_return_base: float | None = None,
    ) -> dict:
        """
        Genera la URL de pago para WebCheckout de PayU.
        
        Args:
            order_id: ID de la orden
            user_email: Email del cliente
            total_amount: Monto total a pagar
            buyer_name: Nombre del comprador
            
        Returns:
            dict con payment_url y payment_reference
        """
        try:
            # Generar referencia única para esta orden
            reference_code = f"ORDER-{order_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # Formatear valores monetarios (2 decimales)
            amount = float(total_amount or 0)
            if amount <= 0:
                raise ValueError("El monto total debe ser mayor que cero")

            if tax_return_base is None or tax_amount is None:
                # Fallback para consistencia en COP si no llegan explícitos
                estimated_base = round(amount / 1.19, 2)
                estimated_tax = round(amount - estimated_base, 2)
            else:
                estimated_base = round(float(tax_return_base), 2)
                estimated_tax = round(float(tax_amount), 2)

            amount_str = f"{amount:.2f}"
            tax_str = f"{estimated_tax:.2f}"
            tax_return_base_str = f"{estimated_base:.2f}"
            currency = "COP"
            
            # Generar firma
            signature = self._generate_signature(
                self.merchant_id,
                reference_code,
                amount_str,
                currency,
                self.api_key
            )
            
            # Construir parámetros para WebCheckout
            params = {
                "merchantId": self.merchant_id,
                "accountId": self.account_id,
                "description": f"Order {order_id} - LukArt",
                "referenceCode": reference_code,
                "amount": amount_str,
                "tax": tax_str,
                "taxReturnBase": tax_return_base_str,
                "currency": currency,
                "signature": signature,
                "test": "1" if self.sandbox_mode else "0",
                "responseUrl": self.response_url or "http://localhost:3000/pagos/resultado",
                "confirmationUrl": self.webhook_url,
                "buyerEmail": user_email,
                "buyerFullName": buyer_name,
                "shippingAddress": "N/A",
                "shippingCity": "Bogotá",
                "shippingCountry": "CO",
                "shippingState": "Bogotá",
                "shippingPostalCode": "110111",
                "telephone": "N/A",
                "extra1": str(order_id),  # Pasar el order_id en extra1
                "extra2": "LukArt_Order",
            }
            
            # Generar URL completa con parámetros
            payment_url = f"{self.base_url}?{urlencode(params)}"
            
            return {
                "payment_url": payment_url,
                "payment_action_url": self.base_url,
                "payment_payload": params,
                "payment_reference": reference_code,
                "status": "url_generated"
            }
        except Exception as e:
            return {
                "error": str(e),
                "status": "error"
            }

    def validate_webhook_signature(self, signature: str, merchant_id: str, transaction_id: str, state: str, response_code_pol: str, reference_code: str, amount: str, currency: str) -> bool:
        """
        Valida la firma del webhook recibido de PayU.
        
        Args:
            signature: Firma recibida del webhook
            ... otros parámetros de la transacción
            
        Returns:
            True si la firma es válida, False en caso contrario
        """
        try:
            expected_signature = self._generate_payment_signature(
                self.api_key,
                merchant_id,
                transaction_id,
                state,
                response_code_pol,
                reference_code,
                amount,
                currency
            )
            
            return signature.lower() == expected_signature.lower()
        except Exception as e:
            print(f"Error validating webhook signature: {str(e)}")
            return False

    def parse_webhook_data(self, webhook_data: dict) -> dict:
        """
        Procesa los datos del webhook de PayU y extrae la información relevante.
        
        Args:
            webhook_data: Diccionario con los datos del webhook
            
        Returns:
            dict con la información procesada
        """
        return {
            "transaction_id": webhook_data.get("transactionId", ""),
            "reference_code": webhook_data.get("referenceCode", ""),
            "order_id": webhook_data.get("extra1", ""),
            "response_code": webhook_data.get("responseCode", ""),
            "response_code_pol": webhook_data.get("responseCodePol", ""),
            "state_pol": webhook_data.get("statePol", ""),
            "state": webhook_data.get("state", ""),
            "amount": webhook_data.get("TX_VALUE", ""),
            "currency": webhook_data.get("currency", ""),
            "email_buyer": webhook_data.get("buyerEmail", ""),
            "signature": webhook_data.get("signature", ""),
            "merchant_id": webhook_data.get("merchantId", ""),
            "account_id": webhook_data.get("accountId", ""),
            "timestamp": webhook_data.get("timestamp", ""),
        }

    @staticmethod
    def get_payment_status(state_pol: str) -> str:
        """
        Convierte el estado de PayU (statePol) a nuestro estado interno.
        
        Estados de PayU:
        - 1: Pendiente
        - 2: Aprobada
        - 3: Declinada
        - 4: Expirada
        - 5: Cancelada
        - 6: Reembolso
        """
        state_mapping = {
            "1": "pending",        # Pendiente
            "2": "approved",       # Aprobada
            "3": "declined",       # Declinada
            "4": "expired",        # Expirada
            "5": "cancelled",      # Cancelada
            "6": "refunded",       # Reembolso
        }
        return state_mapping.get(str(state_pol), "unknown")

    @staticmethod
    def is_payment_approved(response_code: str, state_pol: str) -> bool:
        """
        Determina si el pago fue aprobado.
        
        Un pago es aprobado cuando:
        - response_code == "APPROVED" o response_code == "00"
        - state_pol == "2"
        """
        normalized_response = str(response_code or "").strip().upper()
        normalized_state = str(state_pol or "").strip()

        approved_response = normalized_response in {"APPROVED", "00", "4"}
        approved_state = normalized_state in {"2", "4"}

        return approved_response or approved_state


# Instancia global del proveedor
payu_provider = PayUProvider()
