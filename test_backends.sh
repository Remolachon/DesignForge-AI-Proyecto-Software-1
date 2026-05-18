#!/bin/bash
# Script de verificación rápida de conectividad backend

echo "🔍 Verificando conectividad de backends..."
echo ""

# Función para probar un endpoint
test_api() {
    local url=$1
    local name=$2
    
    echo -n "🌐 Probando $name ($url)... "
    
    if timeout 3 curl -s "$url/docs" > /dev/null 2>&1; then
        echo "✅ OK"
        return 0
    else
        echo "❌ NO RESPONDE"
        return 1
    fi
}

echo "=" | sed 's/./-/g' | head -c 50
echo ""

# Test local backend
test_api "http://localhost:8000" "Backend Local"
local_status=$?

echo ""

# Test Render backend
test_api "https://designforge-ai-proyecto-software-1.onrender.com" "Backend Render"
render_status=$?

echo ""
echo "=" | sed 's/./-/g' | head -c 50
echo ""

if [ $local_status -eq 0 ]; then
    echo "✅ Backend Local está disponible"
    echo "   Usa en .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000"
else
    echo "❌ Backend Local NO está disponible"
    echo "   Asegúrate de ejecutar: python -m app.main"
fi

echo ""

if [ $render_status -eq 0 ]; then
    echo "✅ Backend Render está disponible"
    echo "   Usa en .env.local: NEXT_PUBLIC_API_URL=https://designforge-ai-proyecto-software-1.onrender.com"
else
    echo "❌ Backend Render NO está disponible (¿sin internet?)"
fi

echo ""
echo "📝 Para cambiar entre backends:"
echo "   1. Edita frontend/.env.local"
echo "   2. Cambia la línea NEXT_PUBLIC_API_URL="
echo "   3. El frontend se recargará automáticamente (next dev)"
