/**
 * Exporta dados de um projeto Supabase para arquivos JSON.
 * Uso: node scripts/export-data.mjs --clube-id 1
 *
 * Variáveis de ambiente necessárias:
 *   SOURCE_SUPABASE_URL
 *   SOURCE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const clubeIdIdx = args.indexOf('--clube-id');
const CLUBE_ID = clubeIdIdx !== -1 ? Number(args[clubeIdIdx + 1]) : null;

const SUPABASE_URL = process.env.SOURCE_SUPABASE_URL || 'https://enoacjmlcznsrvynnamf.supabase.co';
const SERVICE_KEY = process.env.SOURCE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ Defina SOURCE_SERVICE_ROLE_KEY no ambiente.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const OUT_DIR = join(__dirname, '..', 'export');
mkdirSync(OUT_DIR, { recursive: true });

// Tabelas globais (exportadas inteiras)
const TABELAS_GLOBAIS = ['programas', 'classes_modelo', 'cargos_modelo'];

// Tabelas por clube
const TABELAS_CLUBE = [
  'clubes',
  'usuarios',
  'usuario_clubes',
  'responsavel_membros',
  'unidades',
  'desbravadores',
  'documentos_modelo',
  'documentos',
  'documento_imagens',
  'documentos_pais_config',
  'progresso_classes',
  'especialidades',
  'pontuacao_itens',
  'pontuacoes',
  'pontuacao_lancamentos',
  'pontuacoes_custom',
  'planos_formativos',
  'atividades',
  'atividades_alvos',
  'atividades_anexos',
  'atividades_respostas',
  'atividades_mensagens',
  'eventos',
  'mensagens_clube',
  'mensagens_clube_lidos',
  'mensagens_clube_ocultos',
  'config_campori',
  'parcelas_campori_config',
  'pagamentos_campori',
  'lgpd_termos',
  'lgpd_aceites',
  'auditoria_eventos',
  'pre_cadastros',
  'convites_responsavel',
  'classe_biblica_respostas',
];

async function exportarTabela(tabela, filtro) {
  let query = supabase.from(tabela).select('*');
  if (filtro) query = query.eq('clube_id', filtro);

  const { data, error } = await query;

  if (error) {
    console.warn(`⚠️  ${tabela}: ${error.message}`);
    return;
  }

  const arquivo = join(OUT_DIR, `${tabela}.json`);
  writeFileSync(arquivo, JSON.stringify(data, null, 2));
  console.log(`✅ ${tabela}: ${data.length} registros`);
}

console.log(`\n📤 Exportando dados do Supabase ${SUPABASE_URL}`);
if (CLUBE_ID) console.log(`   Clube ID: ${CLUBE_ID}`);
console.log('');

for (const tabela of TABELAS_GLOBAIS) {
  await exportarTabela(tabela, null);
}

for (const tabela of TABELAS_CLUBE) {
  await exportarTabela(tabela, CLUBE_ID);
}

console.log(`\n✅ Export concluído em ./export/`);
