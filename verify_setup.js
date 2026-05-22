#!/usr/bin/env node
/**
 * ✅ CHECKLIST DE VERIFICACIÓN RÁPIDA
 * Corre este script para verificar que ambos ambientes funcionan correctamente
 * 
 * Uso: node verify_setup.js
 */

const http = require('http');
const https = require('https');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(color, text) {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log('bold', `  ${title}`);
  console.log('='.repeat(60));
}

async function testApi(url, name) {
  return new Promise((resolve) => {
    const proto = url.startsWith('https') ? https : http;
    const timeStart = Date.now();

    const req = proto.get(`${url}/docs`, { timeout: 3000 }, (res) => {
      const time = Date.now() - timeStart;
      req.abort();
      resolve({ ok: true, time, name });
    });

    req.on('timeout', () => {
      req.abort();
      resolve({ ok: false, time: 'timeout', name });
    });

    req.on('error', () => {
      resolve({ ok: false, time: 'error', name });
    });
  });
}

async function readEnvLocal() {
  const fs = require('fs');
  const path = require('path');

  try {
    const envPath = path.join(__dirname, 'frontend', '.env.local');
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/NEXT_PUBLIC_API_URL=(.+)/);
    if (match) {
      return match[1].trim();
    }
  } catch (e) {
    return null;
  }
}

async function main() {
  log('blue', '\n🔍 VERIFICACIÓN DE CONFIGURACIÓN DEL PROYECTO\n');

  // Check environment
  logSection('1️⃣  CONFIGURACIÓN DEL FRONTEND');
  const currentApiUrl = await readEnvLocal();
  
  if (!currentApiUrl) {
    log('red', '   ❌ No se encontró frontend/.env.local');
    log('yellow', '   ⚠️  Crea el archivo con: NEXT_PUBLIC_API_URL=http://localhost:8000');
  } else {
    log('green', `   ✅ API URL Configurada: ${currentApiUrl}`);
  }

  // Test backends
  logSection('2️⃣  VERIFICACIÓN DE BACKENDS');

  const backends = [
    { url: 'http://localhost:8000', name: 'Backend Local' },
    { url: 'https://designforge-ai-proyecto-software-1.onrender.com', name: 'Backend Render' },
  ];

  const results = await Promise.all(backends.map((b) => testApi(b.url, b.name)));

  let anyBackendOk = false;
  for (const result of results) {
    if (result.ok) {
      log('green', `   ✅ ${result.name} (${result.time}ms)`);
      anyBackendOk = true;
    } else {
      log('red', `   ❌ ${result.name} (${result.time})`);
    }
  }

  // Recommendations
  logSection('3️⃣  RECOMENDACIONES');

  if (!anyBackendOk) {
    log('red', '   ❌ NINGÚN BACKEND DISPONIBLE');
    log('yellow', '   Para Backend Local:');
    log('yellow', '      1. Activa: venv\\Scripts\\activate');
    log('yellow', '      2. Ejecuta: python -m app.main');
    log('yellow', '\n   Para Backend Render:');
    log('yellow', '      1. Verifica conexión a internet');
    log('yellow', '      2. Abre: https://designforge-ai-proyecto-software-1.onrender.com/docs');
  } else if (currentApiUrl === 'http://localhost:8000') {
    log('green', '   ✅ Configurado para Backend Local (Óptimo para desarrollo)');
    const localOk = results.find((r) => r.url === 'http://localhost:8000')?.ok;
    if (!localOk) {
      log('red', '   ⚠️  Pero Backend Local no está disponible');
      log('yellow', '      Ejecuta: python -m app.main en otra terminal');
    }
  } else if (currentApiUrl.includes('render')) {
    log('green', '   ✅ Configurado para Backend Render');
  }

  // Final status
  logSection('4️⃣  ESTADO GENERAL');

  if (currentApiUrl && anyBackendOk) {
    const configuredBackend = results.find(
      (r) => r.url === (currentApiUrl.includes('localhost') ? 'http://localhost:8000' : 'https://designforge-ai-proyecto-software-1.onrender.com')
    );

    if (configuredBackend?.ok) {
      log('green', '   ✅ ¡TODO LISTO! Puedes ejecutar npm run dev');
      console.log('\n   Comandos para iniciar:');
      log('bold', '   $ cd frontend && npm run dev');
      log('bold', '   $ cd backend && python -m app.main  (en otra terminal)');
    } else {
      log('yellow', '   ⚠️  Configurado pero Backend no disponible');
    }
  } else {
    log('red', '   ❌ Necesitas configurar algo');
  }

  console.log('\n');
}

main().catch(log('red', 'Error ejecutando verificación'));
