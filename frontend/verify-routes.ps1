# Verificar estructura de rutas en Windows (PowerShell)

Write-Host "🧪 Verificando Rutas de Frontend" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Yellow

$ErrorMessages = @()
$WarningMessages = @()

# Archivos que deben existir
$requiredFiles = @(
    "src/app/(auth)/layout.tsx",
    "src/app/(auth)/login/page.tsx",
    "src/app/(auth)/register/page.tsx",
    "src/app/(public)/layout.tsx",
    "src/app/layout.tsx",
    "src/app/page.tsx"
)

# Archivos que NO deben existir (duplicados)
$forbiddenFiles = @(
    "src/app/login/page.tsx",
    "src/app/register/page.tsx"
)

Write-Host "`n📁 Verificando archivos requeridos..." -ForegroundColor Yellow

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (FALTA)" -ForegroundColor Red
        $ErrorMessages += $file
    }
}

Write-Host "`n🔍 Verificando que NO hay rutas duplicadas..." -ForegroundColor Yellow

foreach ($file in $forbiddenFiles) {
    if (Test-Path $file) {
        Write-Host "❌ $file (DEBE ELIMINARSE)" -ForegroundColor Red
        $WarningMessages += $file
    } else {
        Write-Host "✅ $file (no existe - correcto)" -ForegroundColor Green
    }
}

# Resultado final
Write-Host "`n====================================" -ForegroundColor Yellow

if ($ErrorMessages.Count -eq 0 -and $WarningMessages.Count -eq 0) {
    Write-Host "✅ ¡Estructura de rutas CORRECTA!" -ForegroundColor Green
    Write-Host "`nAhora ejecuta: " -NoNewline
    Write-Host "npm run dev" -ForegroundColor Yellow
    exit 0
} else {
    if ($ErrorMessages.Count -gt 0) {
        Write-Host "`n❌ Archivos faltantes:" -ForegroundColor Red
        foreach ($msg in $ErrorMessages) {
            Write-Host "   - $msg"
        }
    }
    if ($WarningMessages.Count -gt 0) {
        Write-Host "`n⚠️ Archivos duplicados que deben eliminarse:" -ForegroundColor Red
        foreach ($msg in $WarningMessages) {
            Write-Host "   - $msg"
        }
    }
    Write-Host "`n❌ Hay problemas con la estructura" -ForegroundColor Red
    exit 1
}
