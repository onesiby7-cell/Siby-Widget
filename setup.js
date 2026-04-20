#!/usr/bin/env node
/**
 * SIBY-WIDGET — Script de configuration guidée
 * Usage: node setup.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function setup() {
  console.log('\n' + '═'.repeat(60));
  console.log('  ⚡ SIBY-WIDGET — Configuration guidée');
  console.log('═'.repeat(60) + '\n');

  console.log('📋 Vous aurez besoin de :');
  console.log('  1. URL Supabase + Anon Key  → supabase.com');
  console.log('  2. Clé API Groq             → console.groq.com');
  console.log('  3. URL Edge Function        → après déploiement\n');

  const supabaseUrl = await ask('1️⃣  URL Supabase (ex: https://xxx.supabase.co) : ');
  const supabaseKey = await ask('2️⃣  Anon Key Supabase : ');
  const groqKey     = await ask('3️⃣  Clé API Groq (optionnel, Enter pour passer) : ');
  const edgeFnUrl   = await ask('4️⃣  URL Edge Function (optionnel, Enter pour passer) : ');
  const appUrl      = await ask('5️⃣  URL du dashboard (défaut: http://localhost:3000) : ') || 'http://localhost:3000';

  const envContent = `# SIBY-WIDGET — Variables d'environnement
# Généré automatiquement par setup.js

NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}
NEXT_PUBLIC_EDGE_FUNCTION_URL=${edgeFnUrl || 'https://YOUR_PROJECT.supabase.co/functions/v1/chat-agent'}
NEXT_PUBLIC_WIDGET_CDN_URL=https://cdn.siby-widget.com/widget.js
NEXT_PUBLIC_APP_URL=${appUrl}
NEXT_PUBLIC_APP_NAME=Siby Widget
${groqKey ? `# GROQ_API_KEY=${groqKey} # → Utiliser: supabase secrets set GROQ_API_KEY=${groqKey}` : '# GROQ_API_KEY= → supabase secrets set GROQ_API_KEY=gsk_...'}
`;

  const envPath = path.join(__dirname, 'dashboard', '.env.local');
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Fichier .env.local créé !');
  console.log('\n📦 Étapes suivantes :');
  console.log('  1. cd dashboard && npm install');
  console.log('  2. npm run dev');
  console.log('  3. Exécutez supabase/migrations/001_init.sql dans votre projet Supabase');
  if (groqKey) {
    console.log(`  4. supabase secrets set GROQ_API_KEY=${groqKey}`);
    console.log('  5. supabase functions deploy chat-agent');
  }
  console.log('\n🚀 Ouvrez http://localhost:3000 et créez votre premier agent !\n');

  rl.close();
}

setup().catch(console.error);
