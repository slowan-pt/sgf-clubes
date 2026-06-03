/**
 * Script de exportação do projeto antigo (enoacjmlcznsrvynnamf)
 * para JSON em ./export/
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'export');
mkdirSync(OUT, { recursive: true });

const OLD_URL = 'https://enoacjmlcznsrvynnamf.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVub2Fjam1sY3puc3J2eW5uYW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2OTM2MCwiZXhwIjoyMDkzNzQ1MzYwfQ.apbQgXeVhkpxPH5d8BUpCshBlMReC-lQD1QS6Ow4tLU';

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

console.log('📤 Exportando dados do projeto antigo...\n');
let total = 0;

for (const tabela of TABELAS) {
  const { data, error } = await sb.from(tabela).select('*').limit(10000);

  if (error) {
    if (!error.message.includes('does not exist') && !error.message.includes('relation')) {
      console.warn(`⚠️  ${tabela}: ${error.message}`);
    } else {
      console.log(`⏭️  ${tabela}: não existe no projeto antigo`);
    }
    writeFileSync(join(OUT, `${tabela}.json`), '[]');
    continue;
  }

  writeFileSync(join(OUT, `${tabela}.json`), JSON.stringify(data, null, 2));
  console.log(`✅ ${tabela}: ${data.length} registros`);
  total += data.length;
}

console.log(`\n✅ Export concluído! ${total} registros em ./export/`);
