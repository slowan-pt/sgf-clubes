-- ============================================================
-- SGF Clubes — Migration 001: Schema inicial multiclube
-- ============================================================

-- ─── Extensões ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Programas ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS programas (
  id SERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  idade_minima_membro INTEGER DEFAULT 6,
  idade_maxima_membro INTEGER DEFAULT 15,
  idade_minima_diretoria INTEGER DEFAULT 16,
  ativo BOOLEAN DEFAULT TRUE
);

INSERT INTO programas (codigo, nome, idade_minima_membro, idade_maxima_membro) VALUES
  ('desbravadores', 'Desbravadores', 10, 15),
  ('aventureiros', 'Aventureiros', 6, 9)
ON CONFLICT (codigo) DO NOTHING;

-- ─── Clubes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clubes (
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

-- ─── Usuários ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT,
  foto_url TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para criar usuario automaticamente após signup
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

-- ─── Vínculos usuário ↔ clube ────────────────────────────────
CREATE TABLE IF NOT EXISTS usuario_clubes (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  clube_id INTEGER REFERENCES clubes(id) ON DELETE CASCADE,
  membro_id INTEGER,
  perfil TEXT NOT NULL,
  unidade_id INTEGER,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, clube_id, perfil)
);

-- ─── Responsáveis ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS responsavel_membros (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  membro_id INTEGER NOT NULL,
  clube_id INTEGER REFERENCES clubes(id),
  programa_id INTEGER REFERENCES programas(id),
  parentesco TEXT,
  responsavel_principal BOOLEAN DEFAULT FALSE,
  pode_visualizar BOOLEAN DEFAULT TRUE,
  pode_visualizar_documentos BOOLEAN DEFAULT TRUE,
  pode_enviar_documentos BOOLEAN DEFAULT FALSE,
  pode_responder_atividades BOOLEAN DEFAULT FALSE,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Unidades ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS unidades (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#1a56db',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Cargos modelo ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cargos_modelo (
  id SERIAL PRIMARY KEY,
  programa_id INTEGER REFERENCES programas(id),
  codigo TEXT,
  nome_masculino TEXT NOT NULL,
  nome_feminino TEXT NOT NULL,
  tipo TEXT,
  idade_minima INTEGER,
  idade_maxima INTEGER,
  perfil_sugerido TEXT,
  ativo BOOLEAN DEFAULT TRUE
);

-- Cargos padrão
INSERT INTO cargos_modelo (programa_id, codigo, nome_masculino, nome_feminino, tipo) VALUES
  (1, 'diretor', 'Diretor', 'Diretora', 'diretoria'),
  (1, 'dir_assoc', 'Diretor Associado', 'Diretora Associada', 'diretoria'),
  (1, 'secretario', 'Secretário', 'Secretária', 'diretoria'),
  (1, 'tesoureiro', 'Tesoureiro', 'Tesoureira', 'diretoria'),
  (1, 'capelao', 'Capelão', 'Capelã', 'pastoral'),
  (1, 'conselheiro', 'Conselheiro', 'Conselheira', 'conselheiro'),
  (1, 'instrutor_classes', 'Instrutor de Classes', 'Instrutora de Classes', 'instrutor'),
  (1, 'instrutor_esp', 'Instrutor de Especialidades', 'Instrutora de Especialidades', 'instrutor'),
  (1, 'desbravador', 'Desbravador', 'Desbravadora', 'membro'),
  (2, 'diretor', 'Diretor', 'Diretora', 'diretoria'),
  (2, 'secretario', 'Secretário', 'Secretária', 'diretoria'),
  (2, 'conselheiro', 'Conselheiro', 'Conselheira', 'conselheiro'),
  (2, 'aventureiro', 'Aventureiro', 'Aventureira', 'membro')
ON CONFLICT DO NOTHING;

-- ─── Classes modelo ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classes_modelo (
  id SERIAL PRIMARY KEY,
  programa_id INTEGER REFERENCES programas(id),
  nome TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  tipo TEXT,
  ativo BOOLEAN DEFAULT TRUE
);

INSERT INTO classes_modelo (programa_id, nome, ordem, tipo) VALUES
  (1, 'Amigo', 1, 'regular'),
  (1, 'Amigo da Natureza', 2, 'avancada'),
  (1, 'Companheiro', 3, 'regular'),
  (1, 'Companheiro de Excursionismo', 4, 'avancada'),
  (1, 'Pesquisador', 5, 'regular'),
  (1, 'Pesquisador de Campo e Bosque', 6, 'avancada'),
  (1, 'Pioneiro', 7, 'regular'),
  (1, 'Pioneiro de Novas Fronteiras', 8, 'avancada'),
  (1, 'Excursionista', 9, 'regular'),
  (1, 'Excursionista na Mata', 10, 'avancada'),
  (1, 'Guia', 11, 'regular'),
  (1, 'Guia de Exploração', 12, 'avancada'),
  (2, 'Abelhinhas Laboriosas', 1, NULL),
  (2, 'Luminares', 2, NULL),
  (2, 'Edificadores', 3, NULL),
  (2, 'Mãos Ajudadoras', 4, NULL)
ON CONFLICT DO NOTHING;

-- ─── Membros (desbravadores) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS desbravadores (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id) ON DELETE CASCADE,
  programa_id INTEGER REFERENCES programas(id),
  unidade_id INTEGER REFERENCES unidades(id),
  nome TEXT NOT NULL,
  data_nascimento DATE,
  genero TEXT CHECK (genero IN ('M', 'F')),
  cargo_id INTEGER REFERENCES cargos_modelo(id),
  cargo_adicional_id INTEGER REFERENCES cargos_modelo(id),
  email TEXT,
  telefone TEXT,
  nome_responsavel TEXT,
  contato_responsavel TEXT,
  foto_url TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Documentos ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documentos_modelo (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  programa_id INTEGER REFERENCES programas(id),
  nome TEXT NOT NULL,
  obrigatorio BOOLEAN DEFAULT TRUE,
  permite_anexo BOOLEAN DEFAULT TRUE,
  limite_anexos INTEGER DEFAULT 3,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS documentos (
  id SERIAL PRIMARY KEY,
  membro_id INTEGER REFERENCES desbravadores(id) ON DELETE CASCADE,
  clube_id INTEGER REFERENCES clubes(id),
  documento_modelo_id INTEGER REFERENCES documentos_modelo(id),
  status TEXT DEFAULT 'NOK' CHECK (status IN ('OK', 'NOK', 'NA')),
  observacao TEXT
);

CREATE TABLE IF NOT EXISTS documento_imagens (
  id SERIAL PRIMARY KEY,
  documento_id INTEGER REFERENCES documentos(id) ON DELETE CASCADE,
  clube_id INTEGER REFERENCES clubes(id),
  membro_id INTEGER REFERENCES desbravadores(id),
  url TEXT NOT NULL,
  tipo TEXT,
  nome_arquivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documentos_pais_config (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  data_abertura DATE,
  data_fechamento DATE,
  ativo BOOLEAN DEFAULT FALSE
);

-- ─── Progresso classes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS progresso_classes (
  id SERIAL PRIMARY KEY,
  membro_id INTEGER REFERENCES desbravadores(id) ON DELETE CASCADE,
  clube_id INTEGER REFERENCES clubes(id),
  classe_id INTEGER REFERENCES classes_modelo(id),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','entregue','aprovada','pronto')),
  data_conclusao DATE,
  observacao TEXT,
  UNIQUE(membro_id, classe_id)
);

CREATE TABLE IF NOT EXISTS especialidades (
  id SERIAL PRIMARY KEY,
  membro_id INTEGER REFERENCES desbravadores(id) ON DELETE CASCADE,
  clube_id INTEGER REFERENCES clubes(id),
  nome TEXT NOT NULL,
  categoria TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','entregue','aprovada')),
  data_conclusao DATE,
  atividade_id INTEGER
);

-- ─── Pontuação ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pontuacao_itens (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  sigla TEXT NOT NULL,
  valor INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  ordem INTEGER DEFAULT 0,
  padrao BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pontuacoes (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id) ON DELETE CASCADE,
  membro_id INTEGER REFERENCES desbravadores(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  lancado_por UUID REFERENCES usuarios(id),
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pontuacao_lancamentos (
  id SERIAL PRIMARY KEY,
  pontuacao_id INTEGER REFERENCES pontuacoes(id) ON DELETE CASCADE,
  pontuacao_item_id INTEGER REFERENCES pontuacao_itens(id),
  valor_aplicado INTEGER NOT NULL,
  observacao TEXT
);

CREATE TABLE IF NOT EXISTS pontuacoes_custom (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  membro_id INTEGER REFERENCES desbravadores(id),
  data DATE,
  pontuacao_item_id INTEGER REFERENCES pontuacao_itens(id),
  valor INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Atividades ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planos_formativos (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  nome TEXT,
  tipo TEXT,
  num_avaliacoes INTEGER DEFAULT 1,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS atividades (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prazo TIMESTAMPTZ,
  criado_por UUID REFERENCES usuarios(id),
  avaliador_id UUID REFERENCES usuarios(id),
  item_formativo_tipo TEXT CHECK (item_formativo_tipo IN ('classe','especialidade')),
  item_formativo_id INTEGER,
  gera_investidura BOOLEAN DEFAULT FALSE,
  plano_formativo_id INTEGER REFERENCES planos_formativos(id),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS atividades_alvos (
  id SERIAL PRIMARY KEY,
  atividade_id INTEGER REFERENCES atividades(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('clube','unidade','membro')),
  referencia_id INTEGER
);

CREATE TABLE IF NOT EXISTS atividades_anexos (
  id SERIAL PRIMARY KEY,
  atividade_id INTEGER REFERENCES atividades(id) ON DELETE CASCADE,
  url TEXT,
  nome_arquivo TEXT,
  tipo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS atividades_respostas (
  id SERIAL PRIMARY KEY,
  atividade_id INTEGER REFERENCES atividades(id) ON DELETE CASCADE,
  membro_id INTEGER REFERENCES desbravadores(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'aberta' CHECK (status IN ('aberta','entregue','em_correcao','aprovada','encerrada')),
  texto TEXT,
  nota NUMERIC(4,1),
  avaliacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(atividade_id, membro_id)
);

CREATE TABLE IF NOT EXISTS atividades_mensagens (
  id SERIAL PRIMARY KEY,
  atividade_id INTEGER REFERENCES atividades(id) ON DELETE CASCADE,
  autor_tipo TEXT CHECK (autor_tipo IN ('sistema','avaliador','membro')),
  autor_id UUID REFERENCES usuarios(id),
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Eventos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eventos (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  horario TEXT,
  local TEXT,
  responsavel TEXT,
  apoio TEXT,
  material TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Mensagens ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mensagens_clube (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  corpo TEXT NOT NULL,
  autor_id UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mensagens_clube_lidos (
  id SERIAL PRIMARY KEY,
  mensagem_id INTEGER REFERENCES mensagens_clube(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  lido_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mensagem_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS mensagens_clube_ocultos (
  id SERIAL PRIMARY KEY,
  mensagem_id INTEGER REFERENCES mensagens_clube(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE(mensagem_id, usuario_id)
);

-- ─── Campori ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS config_campori (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id) ON DELETE CASCADE,
  num_parcelas INTEGER DEFAULT 6,
  dia_vencimento INTEGER DEFAULT 10,
  UNIQUE(clube_id)
);

CREATE TABLE IF NOT EXISTS parcelas_campori_config (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  config_campori_id INTEGER REFERENCES config_campori(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  descricao TEXT,
  vencimento DATE
);

CREATE TABLE IF NOT EXISTS pagamentos_campori (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  membro_id INTEGER REFERENCES desbravadores(id) ON DELETE CASCADE,
  parcela_id INTEGER REFERENCES parcelas_campori_config(id),
  valor_pago NUMERIC(10,2) NOT NULL,
  data_pagamento DATE NOT NULL,
  observacao TEXT
);

-- ─── LGPD ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lgpd_termos (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  versao TEXT DEFAULT '1.0',
  vigente BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lgpd_aceites (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  termo_id INTEGER REFERENCES lgpd_termos(id),
  aceito_em TIMESTAMPTZ DEFAULT NOW(),
  ip TEXT,
  UNIQUE(usuario_id, termo_id)
);

-- ─── Auditoria ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auditoria_eventos (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  usuario_id UUID REFERENCES usuarios(id),
  membro_id INTEGER,
  acao TEXT NOT NULL,
  detalhes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Pré-cadastros ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pre_cadastros (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  token TEXT,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  data_nascimento DATE,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','recusado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Convites responsável ────────────────────────────────────
CREATE TABLE IF NOT EXISTS convites_responsavel (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  membro_id INTEGER REFERENCES desbravadores(id),
  token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  criado_por UUID REFERENCES usuarios(id),
  usado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Classe Bíblica ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classe_biblica_respostas (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  clube_id INTEGER REFERENCES clubes(id),
  episodio INTEGER NOT NULL,
  respostas JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, clube_id, episodio)
);

-- ─── Arquivos registro ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS arquivos_registro (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER REFERENCES clubes(id),
  membro_id INTEGER REFERENCES desbravadores(id),
  tipo_entidade TEXT,
  entidade_id INTEGER,
  url TEXT NOT NULL,
  nome_arquivo TEXT,
  tipo_arquivo TEXT,
  confidencial BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RPC: aceitar convite responsável ───────────────────────
CREATE OR REPLACE FUNCTION aceitar_convite_responsavel(p_token TEXT, p_usuario_id UUID)
RETURNS VOID AS $$
DECLARE
  v_convite convites_responsavel%ROWTYPE;
BEGIN
  SELECT * INTO v_convite FROM convites_responsavel WHERE token = p_token AND NOT usado;
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite inválido ou já utilizado.'; END IF;

  INSERT INTO responsavel_membros (usuario_id, membro_id, clube_id, ativo)
  VALUES (p_usuario_id, v_convite.membro_id, v_convite.clube_id, TRUE)
  ON CONFLICT DO NOTHING;

  UPDATE convites_responsavel SET usado = TRUE WHERE id = v_convite.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
