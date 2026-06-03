import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKER = 'https://sgf-migration-runner.slowgithub.workers.dev';
const SECRET = 'Bearer sgf-migration-2024';

async function exec(sql) {
  const res = await fetch(WORKER, {
    method: 'POST',
    headers: { Authorization: SECRET, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql })
  });
  return res.json();
}

const TABELAS_CLUBE = [
  'clubes','unidades','desbravadores','usuario_clubes','responsavel_membros',
  'pontuacao_itens','pontuacoes','pontuacoes_custom','atividades','atividades_alvos',
  'atividades_respostas','atividades_mensagens','atividades_anexos','planos_formativos',
  'eventos','mensagens_clube','documentos','documento_imagens','especialidades',
  'progresso_classes','config_campori','parcelas_campori_config','pagamentos_campori',
  'auditoria_eventos','pre_cadastros','convites_responsavel','documentos_pais_config',
];

const TABELAS_PUBLIC = ['programas', 'cargos_modelo', 'classes_modelo', 'documentos_modelo', 'lgpd_termos'];
const TABELAS_USER = ['usuarios', 'lgpd_aceites', 'mensagens_clube_ocultos', 'classe_biblica_respostas'];

let ok = 0, errs = 0;

async function stmt(sql) {
  const d = await exec(sql);
  if (d.success || (d.error || '').includes('already exists')) ok++;
  else { errs++; console.log('ERR:', sql.slice(0, 60), ':', (d.error || '').slice(0, 80)); }
}

// Helpers
await stmt(`CREATE OR REPLACE FUNCTION clubes_do_usuario()
RETURNS SETOF INTEGER LANGUAGE sql STABLE SECURITY DEFINER AS
'SELECT clube_id FROM usuario_clubes WHERE usuario_id = auth.uid() AND ativo = TRUE'`);

await stmt(`CREATE OR REPLACE FUNCTION is_admin_ti()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS
'SELECT EXISTS (SELECT 1 FROM usuario_clubes WHERE usuario_id = auth.uid() AND perfil = ''admin_ti'' AND ativo = TRUE)'`);

// Habilita RLS
for (const t of [...TABELAS_CLUBE, ...TABELAS_PUBLIC, ...TABELAS_USER]) {
  await stmt(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`);
}

// Policies de leitura pública
for (const t of TABELAS_PUBLIC) {
  await stmt(`CREATE POLICY "${t}_read" ON ${t} FOR SELECT USING (TRUE)`);
}

// Policies por clube
for (const t of TABELAS_CLUBE) {
  await stmt(`CREATE POLICY "${t}_read" ON ${t} FOR SELECT USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti())`);
  await stmt(`CREATE POLICY "${t}_write" ON ${t} FOR ALL USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti())`);
}

// Policies de usuário
await stmt(`CREATE POLICY "usuarios_read" ON usuarios FOR SELECT USING (TRUE)`);
await stmt(`CREATE POLICY "usuarios_update" ON usuarios FOR UPDATE USING (id = auth.uid())`);
await stmt(`CREATE POLICY "lgpd_aceites_read" ON lgpd_aceites FOR SELECT USING (usuario_id = auth.uid() OR is_admin_ti())`);
await stmt(`CREATE POLICY "lgpd_aceites_insert" ON lgpd_aceites FOR INSERT WITH CHECK (usuario_id = auth.uid())`);
await stmt(`CREATE POLICY "msgs_ocultos_read" ON mensagens_clube_ocultos FOR SELECT USING (usuario_id = auth.uid())`);
await stmt(`CREATE POLICY "msgs_ocultos_write" ON mensagens_clube_ocultos FOR ALL USING (usuario_id = auth.uid())`);
await stmt(`CREATE POLICY "cb_read" ON classe_biblica_respostas FOR SELECT USING (usuario_id = auth.uid() OR is_admin_ti())`);
await stmt(`CREATE POLICY "cb_write" ON classe_biblica_respostas FOR ALL USING (usuario_id = auth.uid())`);
await stmt(`CREATE POLICY "precad_insert" ON pre_cadastros FOR INSERT WITH CHECK (TRUE)`);
await stmt(`CREATE POLICY "convites_select" ON convites_responsavel FOR SELECT USING (TRUE)`);

console.log(`\nRLS: ${ok} ok, ${errs} erros`);
