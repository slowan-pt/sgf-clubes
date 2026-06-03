/**
 * Importa dados JSON para um projeto Supabase de destino.
 * Uso: node scripts/import-data.mjs --dir ./export
 *
 * Variáveis de ambiente necessárias:
 *   DEST_SUPABASE_URL
 *   DEST_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const dirIdx = args.indexOf('--dir');
const DIR = dirIdx !== -1 ? args[dirIdx + 1] : join(__dirname, '..', 'export');

const SUPABASE_URL = process.env.DEST_SUPABASE_URL || 'https://bjsbbmxkixodgjlaudkf.supabase.co';
const SERVICE_KEY = process.env.DEST_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ Defina DEST_SERVICE_ROLE_KEY no ambiente.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Ordem de importação por dependência
const ORDEM = [
  'programas',
  'clubes',
  'usuarios',
  'cargos_modelo',
  'classes_modelo',
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

async function importarTabela(tabela) {
  const arquivo = join(DIR, `${tabela}.json`);
  if (!existsSync(arquivo)) {
    console.log(`⏭️  ${tabela}: arquivo não encontrado, pulando`);
    return;
  }

  const dados = JSON.parse(readFileSync(arquivo, 'utf-8'));
  if (!dados?.length) {
    console.log(`⏭️  ${tabela}: vazio`);
    return;
  }

  const { error } = await supabase.from(tabela).upsert(dados, { onConflict: 'id' });

  if (error) {
    console.warn(`⚠️  ${tabela}: ${error.message}`);
  } else {
    console.log(`✅ ${tabela}: ${dados.length} registros importados`);
  }
}

console.log(`\n📥 Importando dados para ${SUPABASE_URL}`);
console.log(`   Diretório: ${DIR}\n`);

for (const tabela of ORDEM) {
  await importarTabela(tabela);
}

console.log('\n✅ Import concluído!');
