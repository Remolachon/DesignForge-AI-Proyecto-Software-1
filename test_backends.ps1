# Script de verificación rápida de conectividad backend (Windows PowerShell)

Write-Host "🔍 Verificando conectividad de backends..." -ForegroundColor Cyan
Write-Host ""

# Función para probar un endpoint
function Test-API {
    param(
        [string]$Url,
        [string]$Name
    )
    
    Write-Host -NoNewline "🌐 Probando $Name ($Url)... "
    
    try {
        $response = Invoke-WebRequest -Uri "$Url/docs" -TimeoutSec 3 -ErrorAction Stop
        Write-Host "✅ OK" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ NO RESPONDE" -ForegroundColor Red
        return $false
    }
}

Write-Host ("=" * 50) -ForegroundColor Gray
Write-Host ""

# Test local backend
$localStatus = Test-API "http://localhost:8000" "Backend Local"

Write-Host ""

# Test Render backend
$renderStatus = Test-API "https://designforge-ai-proyecto-software-1.onrender.com" "Backend Render"

Write-Host ""
Write-Host ("=" * 50) -ForegroundColor Gray
Write-Host ""

if ($localStatus) {
    Write-Host "✅ Backend Local está disponible" -ForegroundColor Green
    Write-Host "   Usa en .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000" -ForegroundColor Gray
}
else {
    Write-Host "❌ Backend Local NO está disponible" -ForegroundColor Red
    Write-Host "   Asegúrate de ejecutar: python -m app.main" -ForegroundColor Gray
}

Write-Host ""

if ($renderStatus) {
    Write-Host "✅ Backend Render está disponible" -ForegroundColor Green
    Write-Host "   Usa en .env.local: NEXT_PUBLIC_API_URL=https://designforge-ai-proyecto-software-1.onrender.com" -ForegroundColor Gray
}
else {
    Write-Host "❌ Backend Render NO está disponible (¿sin internet?)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📝 Para cambiar entre backends:" -ForegroundColor Cyan
Write-Host "   1. Edita frontend/.env.local" -ForegroundColor Gray
Write-Host "   2. Cambia la línea NEXT_PUBLIC_API_URL=" -ForegroundColor Gray
Write-Host "   3. El frontend se recargará automáticamente (npm run dev)" -ForegroundColor Gray
