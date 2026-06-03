-- ============================================================
-- Migration 003: Recria schema real (baseado no projeto antigo)
-- Drop das tabelas da migration 001 e recria com schema correto
-- ============================================================

-- Drop tudo na ordem correta
DROP TABLE IF EXISTS classe_biblica_respostas CASCADE;
DROP TABLE IF EXISTS arquivos_registro CASCADE;
DROP TABLE IF EXISTS convites_responsavel CASCADE;
DROP TABLE IF EXISTS lgpd_aceites CASCADE;
DROP TABLE IF EXISTS lgpd_termos CASCADE;
DROP TABLE IF EXISTS auditoria_eventos CASCADE;
DROP TABLE IF EXISTS pre_cadastros CASCADE;
DROP TABLE IF EXISTS pagamentos_campori CASCADE;
DROP TABLE IF EXISTS parcelas_campori_config CASCADE;
DROP TABLE IF EXISTS config_campori CASCADE;
DROP TABLE IF EXISTS mensagens_clube_ocultos CASCADE;
DROP TABLE IF EXISTS mensagens_clube_lidos CASCADE;
DROP TABLE IF EXISTS mensagens_clube CASCADE;
DROP TABLE IF EXISTS eventos CASCADE;
DROP TABLE IF EXISTS atividades_mensagens CASCADE;
DROP TABLE IF EXISTS atividades_respostas CASCADE;
DROP TABLE IF EXISTS atividades_anexos CASCADE;
DROP TABLE IF EXISTS atividades_alvos CASCADE;
DROP TABLE IF EXISTS atividades CASCADE;
DROP TABLE IF EXISTS planos_formativos CASCADE;
DROP TABLE IF EXISTS pontuacoes_custom CASCADE;
DROP TABLE IF EXISTS pontuacao_lancamentos CASCADE;
DROP TABLE IF EXISTS pontuacoes CASCADE;
DROP TABLE IF EXISTS pontuacao_itens CASCADE;
DROP TABLE IF EXISTS especialidades CASCADE;
DROP TABLE IF EXISTS progresso_classes CASCADE;
DROP TABLE IF EXISTS documentos_pais_config CASCADE;
DROP TABLE IF EXISTS documento_imagens CASCADE;
DROP TABLE IF EXISTS documentos CASCADE;
DROP TABLE IF EXISTS documentos_modelo CASCADE;
DROP TABLE IF EXISTS classes_modelo CASCADE;
DROP TABLE IF EXISTS cargos_modelo CASCADE;
DROP TABLE IF EXISTS responsavel_membros CASCADE;
DROP TABLE IF EXISTS usuario_clubes CASCADE;
DROP TABLE IF EXISTS desbravadores CASCADE;
DROP TABLE IF EXISTS unidades CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS clubes CASCADE;
DROP TABLE IF EXISTS programas CASCADE;

-- ─── Tabelas base ─────────────────────────────────────────────────────────────

CREATE TABLE programas (
  id SERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  idade_minima_membro INTEGER DEFAULT 6,
  idade_maxima_membro INTEGER DEFAULT 15,
  idade_minima_diretoria INTEGER DEFAULT 16,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clubes (
  id SERIAL PRIMARY KEY,
  programa_id INTEGER REFERENCES programas(id),
  nome TEXT NOT NULL,
  nome_curto TEXT,
  codigo TEXT,
  igreja TEXT,
  distrito TEXT,
  regional TEXT,
  cidade TEXT,
  uf TEXT,
  logo_url TEXT,
  cor_primaria TEXT DEFAULT '#1a56db',
  cor_secundaria TEXT DEFAULT '#1e429f',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT,
  perfil TEXT,
  unidade_id INTEGER,
  dbv_id INTEGER,
  foto_url TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO usuarios (id, email, nome)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE unidades (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  codigo_clube TEXT,
  senha_unidade TEXT,
  cor TEXT DEFAULT '#1a56db',
  ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE cargos_modelo (
  id SERIAL PRIMARY KEY,
  programa_id INTEGER REFERENCES programas(id),
  codigo TEXT,
  nome_masculino TEXT NOT NULL,
  nome_feminino TEXT NOT NULL,
  tipo TEXT,
  idade_minima INTEGER,
  idade_maxima INTEGER,
  perfil_sugerido TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE classes_modelo (
  id SERIAL PRIMARY KEY,
  programa_id INTEGER REFERENCES programas(id),
  nome TEXT NOT NULL,
  tipo TEXT,
  codigo TEXT,
  nome_completo TEXT,
  categoria TEXT,
  fonte_oficial TEXT,
  imagem_url TEXT,
  imagem_arquivo TEXT,
  idade_indicada INTEGER,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Membros ──────────────────────────────────────────────────────────────────

CREATE TABLE desbravadores (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id) ON DELETE CASCADE,
  idx INTEGER,
  id_sgc TEXT,
  nome TEXT NOT NULL,
  data_nascimento DATE,
  idade INTEGER,
  genero TEXT,
  unidade_id INTEGER REFERENCES unidades(id),
  unidade_nome TEXT,
  cargo TEXT,
  cargo_adicional TEXT,
  contato TEXT,
  email TEXT,
  camisa TEXT,
  calca TEXT,
  campori_dsa TEXT,
  nome_responsavel TEXT,
  contato_responsavel TEXT,
  foto_url TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Vínculos ─────────────────────────────────────────────────────────────────

CREATE TABLE usuario_clubes (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  clube_id INTEGER REFERENCES clubes(id) ON DELETE CASCADE,
  membro_id INTEGER,
  perfil TEXT NOT NULL,
  unidade_id INTEGER,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE responsavel_membros (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  membro_id INTEGER REFERENCES desbravadores(id) ON DELETE CASCADE,
  clube_id INTEGER REFERENCES clubes(id),
  programa_id INTEGER REFERENCES programas(id),
  parentesco TEXT,
  responsavel_principal BOOLEAN DEFAULT FALSE,
  pode_visualizar BOOLEAN DEFAULT TRUE,
  pode_visualizar_documentos BOOLEAN DEFAULT TRUE,
  pode_enviar_documentos BOOLEAN DEFAULT FALSE,
  pode_responder_atividades BOOLEAN DEFAULT FALSE,
  ativo BOOLEAN DEFAULT TRUE,
  nome_cache TEXT,
  email_cache TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Documentos ───────────────────────────────────────────────────────────────

CREATE TABLE documentos_modelo (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  programa_id INTEGER REFERENCES programas(id),
  campo TEXT,
  nome TEXT NOT NULL,
  obrigatorio BOOLEAN DEFAULT TRUE,
  permite_anexo BOOLEAN DEFAULT TRUE,
  limite_anexos INTEGER DEFAULT 3,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documentos: schema legado (uma linha por membro com todos os campos)
CREATE TABLE documentos (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  dbv_id INTEGER REFERENCES desbravadores(id) ON DELETE CASCADE,
  rg TEXT,
  cpf TEXT,
  rg_resp TEXT,
  cartao_sus TEXT,
  cartao_plano TEXT,
  ficha_saude TEXT,
  carteira_vacinacao TEXT,
  laudo_medico TEXT,
  ficha_reg TEXT,
  comp_residencia TEXT,
  aut_saida TEXT,
  aut_viagem TEXT,
  ri_assinado TEXT,
  foto TEXT,
  ant_criminais TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documento_imagens (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  dbv_id INTEGER REFERENCES desbravadores(id) ON DELETE CASCADE,
  campo TEXT,
  url TEXT NOT NULL,
  nome TEXT,
  tipo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documentos_pais_config (
  clube_id INTEGER PRIMARY KEY REFERENCES clubes(id),
  pais_podem_editar BOOLEAN DEFAULT FALSE,
  editar_de TIMESTAMPTZ,
  editar_ate TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Progresso ────────────────────────────────────────────────────────────────

-- Progresso: schema legado (uma linha por membro com todas as classes)
CREATE TABLE progresso_classes (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  dbv_id INTEGER REFERENCES desbravadores(id) ON DELETE CASCADE,
  amigo TEXT,
  amigo_nat TEXT,
  companheiro TEXT,
  comp_exc TEXT,
  pesquisador TEXT,
  pesquisador_cb TEXT,
  pioneiro TEXT,
  pioneiro_nf TEXT,
  excursionista TEXT,
  exc_mata TEXT,
  guia TEXT,
  guia_exp TEXT,
  agrupada TEXT,
  lider TEXT,
  lider_master TEXT,
  lider_ma TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE especialidades (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  dbv_id INTEGER REFERENCES desbravadores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  status TEXT DEFAULT 'pendente',
  plano_formativo_id INTEGER,
  atividade_origem_id INTEGER,
  atividade_origem_titulo TEXT,
  atividade_origem_excluida BOOLEAN DEFAULT FALSE,
  atividade_origem_excluida_em TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Pontuação ────────────────────────────────────────────────────────────────

CREATE TABLE pontuacao_itens (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id) ON DELETE CASCADE,
  programa_id INTEGER REFERENCES programas(id),
  titulo TEXT NOT NULL,
  sigla TEXT NOT NULL,
  valor INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  ordem INTEGER DEFAULT 0,
  padrao BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pontuações: schema legado (colunas fixas + extras)
CREATE TABLE pontuacoes (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id) ON DELETE CASCADE,
  dbv_id INTEGER REFERENCES desbravadores(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  presenca BOOLEAN DEFAULT FALSE,
  pontualidade BOOLEAN DEFAULT FALSE,
  material BOOLEAN DEFAULT FALSE,
  uniforme BOOLEAN DEFAULT FALSE,
  bom_biblia BOOLEAN DEFAULT FALSE,
  pontos_extras INTEGER DEFAULT 0,
  classe_biblica BOOLEAN DEFAULT FALSE,
  especialidade BOOLEAN DEFAULT FALSE,
  pgm_especial BOOLEAN DEFAULT FALSE,
  atividade_unidade BOOLEAN DEFAULT FALSE,
  presenca_pts INTEGER DEFAULT 0,
  pontualidade_pts INTEGER DEFAULT 0,
  material_pts INTEGER DEFAULT 0,
  uniforme_pts INTEGER DEFAULT 0,
  observacao TEXT,
  lancado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pontuacoes_custom (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  dbv_id INTEGER REFERENCES desbravadores(id) ON DELETE CASCADE,
  data DATE,
  item_id INTEGER REFERENCES pontuacao_itens(id),
  item_nome TEXT,
  item_valor INTEGER,
  quantidade INTEGER DEFAULT 1,
  pontos INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Atividades ───────────────────────────────────────────────────────────────

CREATE TABLE planos_formativos (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  tipo TEXT,
  item_nome TEXT,
  titulo TEXT,
  avaliacoes_necessarias INTEGER DEFAULT 1,
  ativo BOOLEAN DEFAULT TRUE,
  criado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE atividades (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data TIMESTAMPTZ,
  destino TEXT,
  unidade_id INTEGER REFERENCES unidades(id),
  unidade_nome TEXT,
  dbv_id INTEGER REFERENCES desbravadores(id),
  dbv_nome TEXT,
  criado_por UUID REFERENCES usuarios(id),
  avaliador_id UUID REFERENCES usuarios(id),
  avaliador_nome TEXT,
  item_formativo_tipo TEXT,
  item_formativo_nome TEXT,
  gera_investidura BOOLEAN DEFAULT FALSE,
  plano_formativo_id INTEGER REFERENCES planos_formativos(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE atividades_alvos (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  atividade_id INTEGER REFERENCES atividades(id) ON DELETE CASCADE,
  tipo TEXT,
  unidade_id INTEGER,
  membro_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE atividades_anexos (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  atividade_id INTEGER REFERENCES atividades(id) ON DELETE CASCADE,
  nome TEXT,
  url TEXT,
  tipo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE atividades_respostas (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  atividade_id INTEGER REFERENCES atividades(id) ON DELETE CASCADE,
  dbv_id INTEGER REFERENCES desbravadores(id) ON DELETE CASCADE,
  dbv_nome TEXT,
  texto TEXT,
  anexo_url TEXT,
  anexo_nome TEXT,
  status TEXT DEFAULT 'aberta',
  nota NUMERIC(4,1),
  comentario_avaliador TEXT,
  avaliado_por UUID,
  avaliado_em TIMESTAMPTZ,
  entregue_em TIMESTAMPTZ,
  reaberto_ate TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE atividades_mensagens (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  atividade_id INTEGER REFERENCES atividades(id) ON DELETE CASCADE,
  dbv_id INTEGER REFERENCES desbravadores(id),
  autor_tipo TEXT,
  autor_id UUID,
  autor_nome TEXT,
  tipo TEXT,
  texto TEXT NOT NULL,
  anexo_url TEXT,
  anexo_nome TEXT,
  status TEXT,
  nota NUMERIC(4,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Eventos e Comunicação ────────────────────────────────────────────────────

CREATE TABLE eventos (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id) ON DELETE CASCADE,
  data DATE,
  horario TEXT,
  local TEXT,
  atividade TEXT,
  responsavel TEXT,
  apoio TEXT,
  material TEXT,
  observacoes TEXT,
  semestre TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mensagens_clube (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  corpo TEXT NOT NULL,
  enviado_por UUID REFERENCES usuarios(id),
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mensagens_clube_ocultos (
  id SERIAL PRIMARY KEY,
  mensagem_id INTEGER REFERENCES mensagens_clube(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mensagem_id, usuario_id)
);

-- ─── Campori ──────────────────────────────────────────────────────────────────

CREATE TABLE config_campori (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  num_parcelas INTEGER DEFAULT 6,
  data_vencimento_dia INTEGER DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE parcelas_campori_config (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  config_campori_id INTEGER REFERENCES config_campori(id),
  numero INTEGER NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  descricao TEXT
);

CREATE TABLE pagamentos_campori (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  dbv_id INTEGER REFERENCES desbravadores(id),
  parcela_id INTEGER REFERENCES parcelas_campori_config(id),
  valor_pago NUMERIC(10,2),
  data_pagamento DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LGPD e Governança ────────────────────────────────────────────────────────

CREATE TABLE lgpd_termos (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  programa_id INTEGER REFERENCES programas(id),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  versao TEXT DEFAULT '1.0',
  ativo BOOLEAN DEFAULT FALSE,
  criado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lgpd_aceites (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  programa_id INTEGER REFERENCES programas(id),
  termo_id INTEGER REFERENCES lgpd_termos(id),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  email TEXT,
  nome TEXT,
  perfil TEXT,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, termo_id)
);

CREATE TABLE auditoria_eventos (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  programa_id INTEGER REFERENCES programas(id),
  ator_user_id UUID REFERENCES usuarios(id),
  alvo_user_id UUID REFERENCES usuarios(id),
  membro_id INTEGER,
  acao TEXT NOT NULL,
  entidade TEXT,
  entidade_id INTEGER,
  antes JSONB,
  depois JSONB,
  metadata JSONB,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pre_cadastros (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  token TEXT,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  data_nascimento DATE,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE convites_responsavel (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  membro_id INTEGER REFERENCES desbravadores(id),
  token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  criado_por UUID REFERENCES usuarios(id),
  usado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE classe_biblica_respostas (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  clube_id INTEGER REFERENCES clubes(id),
  episodio INTEGER NOT NULL,
  respostas JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, clube_id, episodio)
);

-- ─── Dados iniciais ───────────────────────────────────────────────────────────

INSERT INTO programas (codigo, nome, idade_minima_membro, idade_maxima_membro) VALUES
  ('desbravadores', 'Desbravadores', 10, 15),
  ('aventureiros', 'Aventureiros', 6, 9)
ON CONFLICT (codigo) DO NOTHING;

-- ─── RPC ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION aceitar_convite_responsavel(p_token TEXT, p_usuario_id UUID)
RETURNS VOID AS $$
DECLARE v convites_responsavel%ROWTYPE;
BEGIN
  SELECT * INTO v FROM convites_responsavel WHERE token = p_token AND NOT usado;
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite inválido ou já utilizado.'; END IF;
  INSERT INTO responsavel_membros (usuario_id, membro_id, clube_id, ativo)
  VALUES (p_usuario_id, v.membro_id, v.clube_id, TRUE) ON CONFLICT DO NOTHING;
  UPDATE convites_responsavel SET usado = TRUE WHERE id = v.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
