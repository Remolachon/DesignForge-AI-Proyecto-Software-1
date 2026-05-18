#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Verificando Rutas de Frontend${NC}"
echo "===================================="

# Verificar que los archivos necesarios existen
echo -e "\n${YELLOW}📁 Verificando estructura de carpetas...${NC}"

files_to_check=(
    "src/app/(auth)/layout.tsx"
    "src/app/(auth)/login/page.tsx"
    "src/app/(auth)/register/page.tsx"
    "src/app/(public)/layout.tsx"
    "src/app/layout.tsx"
    "src/app/page.tsx"
)

all_exist=true
for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file (FALTA)"
        all_exist=false
    fi
done

# Verificar que NO existen rutas duplicadas
echo -e "\n${YELLOW}🔍 Verificando que NO hay rutas duplicadas...${NC}"

duplicate_files=(
    "src/app/login/page.tsx"
    "src/app/register/page.tsx"
)

duplicates_found=false
for file in "${duplicate_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${RED}❌${NC} $file (DEBE ELIMINARSE)"
        duplicates_found=true
    else
        echo -e "${GREEN}✅${NC} $file (no existe - correcto)"
    fi
done

# Resultado final
echo -e "\n===================================="
if [ "$all_exist" = true ] && [ "$duplicates_found" = false ]; then
    echo -e "${GREEN}✅ ¡Estructura de rutas CORRECTA!${NC}"
    echo -e "\nAhora ejecuta: ${YELLOW}npm run dev${NC}"
    exit 0
else
    echo -e "${RED}❌ Hay problemas con la estructura${NC}"
    exit 1
fi
