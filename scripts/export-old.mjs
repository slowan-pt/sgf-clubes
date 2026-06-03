/**
 * Script de exportação do projeto antigo para JSON em ./export/
 *
 * Uso: SOURCE_SUPABASE_URL=... SOURCE_SERVICE_ROLE_KEY=... node scripts/export-old.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'export');
mkdirSync(OUT, { recursive: true });

const OLD_URL = process.env.SOURCE_SUPABASE_URL || '';
const OLD_KEY = process.env.SOURCE_SERVICE_ROLE_KEY || '';

if (!OLD_URL || !OLD_KEY) {
  console.error('Defina SOURCE_SUPABASE_URL e SOURCE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(OLD_URL, OLD_KEY);

const TABELAS = [
  'programas','clubes','usuarios','usuario_clubes','responsavel_membros',
  'unidades','desbravadores','cargos_modelo','classes_modelo','documentos_modelo',
  'documentos','documento_imagens','documentos_pais_config',
  'progresso_classes','especialidades',
  'pontuacao_itens','pontuacoes','pontuacao_lancamentos','pontuacoes_custom',
  'planos_formativos','atividades','atividades_alvos','atividades_anexos',
  'atividades_respostas','atividades_mensagens',
  'eventos','mensagens_clube','mensagens_clube_lidos','mensagens_clube_ocultos',
  'config_campori','parcelas_campori_config','pagamentos_campori',
  'lgpd_termos','lgpd_aceites','auditoria_eventos','pre_cadastros',
  'convites_responsavel','classe_biblica_respostas',
];

console.log('📤 Exportando...');
for (const tabela of TABELAS) {
  const { data, error } = await sb.from(tabela).select('*').limit(10000);
  if (error) { writeFileSync(join(OUT, `${tabela}.json`), '[]'); continue; }
  writeFileSync(join(OUT, `${tabela}.json`), JSON.stringify(data, null, 2));
  console.log(`✅ ${tabela}: ${data.length}`);
}
console.log('✅ Concluído');
