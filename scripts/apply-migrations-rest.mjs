/**
 * Aplica migrations usando a API REST do Supabase.
 * Usa o endpoint /rest/v1/rpc/ com service_role para criar as tabelas.
 *
 * Estratégia: cria uma função exec_ddl via SQL usando o endpoint de setup do Auth,
 * depois usa essa função para aplicar o schema completo.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://bjsbbmxkixodgjlaudkf.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc2JibXhraXhvZGdqbGF1ZGtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQ0NDY2MiwiZXhwIjoyMDk2MDIwNjYyfQ.NqKx8wiTz4r4XCcFuzirAsMFwATYWulUd7YDhf8eoLY';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Verifica se as tabelas já existem
async function tabelaExiste(nome) {
  const { data } = await supabase.from(nome).select('*').limit(1);
  return data !== null;
}

async function verificarEstado() {
  console.log('🔍 Verificando estado atual do banco...\n');
  const tabelas = ['programas', 'clubes', 'desbravadores', 'pontuacoes'];
  for (const t of tabelas) {
    const existe = await tabelaExiste(t);
    console.log(`  ${existe ? '✅' : '❌'} ${t}`);
  }
}

await verificarEstado();

console.log('\n⚠️  Para aplicar as migrations, acesse o SQL Editor do Supabase:');
console.log('   https://supabase.com/dashboard/project/bjsbbmxkixodgjlaudkf/sql\n');
console.log('   Cole o conteúdo de: supabase/migrations/001_schema_inicial.sql');
console.log('   Depois cole: supabase/migrations/002_rls.sql');
