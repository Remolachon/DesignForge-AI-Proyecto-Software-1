@echo off
echo ===================================
echo 🚀 VERIFICANDO FRONTEND...
cd frontend
call npm run lint
if %errorlevel% neq 0 exit /b %errorlevel%
call npm run test:coverage
if %errorlevel% neq 0 exit /b %errorlevel%
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo ===================================
echo 🐍 VERIFICANDO BACKEND...
cd backend
call venv\Scripts\activate.bat
flake8 app/ --count --select=E9,F63,F7,F82 --show-source --statistics
if %errorlevel% neq 0 exit /b %errorlevel%
pytest tests/
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo ===================================
echo ✅ TODO PERFECTO. LISTO PARA EL COMMIT.
