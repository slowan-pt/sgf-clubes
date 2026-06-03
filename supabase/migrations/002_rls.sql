-- ============================================================
-- SGF Clubes — Migration 002: Row Level Security (RLS)
-- ============================================================

-- Habilita RLS em todas as tabelas operacionais
ALTER TABLE clubes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_clubes ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsavel_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE desbravadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documento_imagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_pais_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontuacao_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontuacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontuacao_lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontuacoes_custom ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_formativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades_alvos ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_clube ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_clube_lidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_clube_ocultos ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_campori ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas_campori_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_campori ENABLE ROW LEVEL SECURITY;
ALTER TABLE lgpd_termos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lgpd_aceites ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_cadastros ENABLE ROW LEVEL SECURITY;
ALTER TABLE convites_responsavel ENABLE ROW LEVEL SECURITY;
ALTER TABLE classe_biblica_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE arquivos_registro ENABLE ROW LEVEL SECURITY;

-- ─── Função helper: clubes do usuário ───────────────────────
CREATE OR REPLACE FUNCTION clubes_do_usuario()
RETURNS SETOF INTEGER LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT clube_id FROM usuario_clubes
  WHERE usuario_id = auth.uid() AND ativo = TRUE;
$$;

-- ─── Função helper: é admin_ti? ─────────────────────────────
CREATE OR REPLACE FUNCTION is_admin_ti()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuario_clubes
    WHERE usuario_id = auth.uid() AND perfil = 'admin_ti' AND ativo = TRUE
  );
$$;

-- ─── Função helper: membros do responsável ──────────────────
CREATE OR REPLACE FUNCTION membros_como_responsavel()
RETURNS SETOF INTEGER LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT membro_id FROM responsavel_membros
  WHERE usuario_id = auth.uid() AND ativo = TRUE;
$$;

-- ─── Políticas: clubes ───────────────────────────────────────
CREATE POLICY "Usuários veem seus clubes" ON clubes FOR SELECT
  USING (id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

CREATE POLICY "Admins gerenciam clubes" ON clubes FOR ALL
  USING (is_admin_ti())
  WITH CHECK (is_admin_ti());

-- ─── Políticas: usuario_clubes ───────────────────────────────
CREATE POLICY "Vê próprios vínculos" ON usuario_clubes FOR SELECT
  USING (usuario_id = auth.uid() OR is_admin_ti() OR
    clube_id IN (
      SELECT uc.clube_id FROM usuario_clubes uc
      WHERE uc.usuario_id = auth.uid() AND uc.perfil IN ('admin_ti','admin_clube') AND uc.ativo = TRUE
    ));

CREATE POLICY "Admin gerencia vínculos" ON usuario_clubes FOR ALL
  USING (clube_id IN (
    SELECT uc.clube_id FROM usuario_clubes uc
    WHERE uc.usuario_id = auth.uid() AND uc.perfil IN ('admin_ti','admin_clube') AND uc.ativo = TRUE
  ) OR is_admin_ti());

-- ─── Políticas: responsavel_membros ─────────────────────────
CREATE POLICY "Vê próprios vínculos de responsável" ON responsavel_membros FOR SELECT
  USING (usuario_id = auth.uid() OR
    clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

CREATE POLICY "Gerencia vínculos de responsável" ON responsavel_membros FOR ALL
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

-- ─── Políticas: unidades ─────────────────────────────────────
CREATE POLICY "Usuários veem unidades do clube" ON unidades FOR SELECT
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

CREATE POLICY "Admin gerencia unidades" ON unidades FOR ALL
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

-- ─── Políticas: desbravadores ────────────────────────────────
CREATE POLICY "Vê membros do clube" ON desbravadores FOR SELECT
  USING (
    clube_id IN (SELECT clubes_do_usuario()) OR
    id IN (SELECT membros_como_responsavel()) OR
    is_admin_ti()
  );

CREATE POLICY "Gerencia membros do clube" ON desbravadores FOR ALL
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

-- ─── Políticas: documentos ───────────────────────────────────
CREATE POLICY "Vê documentos do clube" ON documentos FOR SELECT
  USING (
    clube_id IN (SELECT clubes_do_usuario()) OR
    membro_id IN (SELECT membros_como_responsavel()) OR
    is_admin_ti()
  );

CREATE POLICY "Gerencia documentos" ON documentos FOR ALL
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

-- ─── Políticas: documento_imagens ────────────────────────────
CREATE POLICY "Vê imagens de documentos" ON documento_imagens FOR SELECT
  USING (clube_id IN (SELECT clubes_do_usuario()) OR membro_id IN (SELECT membros_como_responsavel()) OR is_admin_ti());

CREATE POLICY "Gerencia imagens" ON documento_imagens FOR ALL
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

-- ─── Políticas: pontuação ────────────────────────────────────
CREATE POLICY "Vê itens de pontuação" ON pontuacao_itens FOR SELECT
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

CREATE POLICY "Gerencia itens de pontuação" ON pontuacao_itens FOR ALL
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

CREATE POLICY "Vê pontuações" ON pontuacoes FOR SELECT
  USING (clube_id IN (SELECT clubes_do_usuario()) OR membro_id IN (SELECT membros_como_responsavel()) OR is_admin_ti());

CREATE POLICY "Gerencia pontuações" ON pontuacoes FOR ALL
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

CREATE POLICY "Vê lançamentos" ON pontuacao_lancamentos FOR SELECT
  USING (pontuacao_id IN (SELECT id FROM pontuacoes WHERE clube_id IN (SELECT clubes_do_usuario())) OR is_admin_ti());

CREATE POLICY "Gerencia lançamentos" ON pontuacao_lancamentos FOR ALL
  USING (pontuacao_id IN (SELECT id FROM pontuacoes WHERE clube_id IN (SELECT clubes_do_usuario())) OR is_admin_ti());

-- ─── Políticas: progresso_classes e especialidades ───────────
CREATE POLICY "Vê progresso" ON progresso_classes FOR SELECT
  USING (clube_id IN (SELECT clubes_do_usuario()) OR membro_id IN (SELECT membros_como_responsavel()) OR is_admin_ti());

CREATE POLICY "Gerencia progresso" ON progresso_classes FOR ALL
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

CREATE POLICY "Vê especialidades" ON especialidades FOR SELECT
  USING (clube_id IN (SELECT clubes_do_usuario()) OR membro_id IN (SELECT membros_como_responsavel()) OR is_admin_ti());

CREATE POLICY "Gerencia especialidades" ON especialidades FOR ALL
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

-- ─── Políticas: atividades ───────────────────────────────────
CREATE POLICY "Vê atividades do clube" ON atividades FOR SELECT
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

CREATE POLICY "Gerencia atividades" ON atividades FOR ALL
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

CREATE POLICY "Vê alvos" ON atividades_alvos FOR SELECT
  USING (atividade_id IN (SELECT id FROM atividades WHERE clube_id IN (SELECT clubes_do_usuario())) OR is_admin_ti());

CREATE POLICY "Gerencia alvos" ON atividades_alvos FOR ALL
  USING (atividade_id IN (SELECT id FROM atividades WHERE clube_id IN (SELECT clubes_do_usuario())) OR is_admin_ti());

CREATE POLICY "Vê respostas" ON atividades_respostas FOR SELECT
  USING (
    atividade_id IN (SELECT id FROM atividades WHERE clube_id IN (SELECT clubes_do_usuario())) OR
    membro_id IN (SELECT membros_como_responsavel()) OR
    is_admin_ti()
  );

CREATE POLICY "Gerencia respostas" ON atividades_respostas FOR ALL
  USING (atividade_id IN (SELECT id FROM atividades WHERE clube_id IN (SELECT clubes_do_usuario())) OR is_admin_ti());

CREATE POLICY "Vê mensagens da atividade" ON atividades_mensagens FOR SELECT
  USING (atividade_id IN (SELECT id FROM atividades WHERE clube_id IN (SELECT clubes_do_usuario())) OR is_admin_ti());

CREATE POLICY "Gerencia mensagens da atividade" ON atividades_mensagens FOR ALL
  USING (atividade_id IN (SELECT id FROM atividades WHERE clube_id IN (SELECT clubes_do_usuario())) OR is_admin_ti());

-- ─── Políticas: eventos ──────────────────────────────────────
CREATE POLICY "Vê eventos do clube" ON eventos FOR SELECT
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

CREATE POLICY "Gerencia eventos" ON eventos FOR ALL
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

-- ─── Políticas: mensagens ────────────────────────────────────
CREATE POLICY "Vê mensagens do clube" ON mensagens_clube FOR SELECT
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

CREATE POLICY "Gerencia mensagens" ON mensagens_clube FOR ALL
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

CREATE POLICY "Vê lidos" ON mensagens_clube_lidos FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "Gerencia lidos" ON mensagens_clube_lidos FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "Vê ocultos" ON mensagens_clube_ocultos FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "Gerencia ocultos" ON mensagens_clube_ocultos FOR ALL USING (usuario_id = auth.uid());

-- ─── Políticas: campori ──────────────────────────────────────
CREATE POLICY "Vê campori" ON config_campori FOR SELECT USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());
CREATE POLICY "Gerencia campori" ON config_campori FOR ALL USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());
CREATE POLICY "Vê parcelas" ON parcelas_campori_config FOR SELECT USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());
CREATE POLICY "Gerencia parcelas" ON parcelas_campori_config FOR ALL USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());
CREATE POLICY "Vê pagamentos" ON pagamentos_campori FOR SELECT USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());
CREATE POLICY "Gerencia pagamentos" ON pagamentos_campori FOR ALL USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

-- ─── Políticas: LGPD ─────────────────────────────────────────
CREATE POLICY "Vê termos" ON lgpd_termos FOR SELECT USING (TRUE);
CREATE POLICY "Gerencia termos" ON lgpd_termos FOR ALL USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());
CREATE POLICY "Vê próprio aceite" ON lgpd_aceites FOR SELECT USING (usuario_id = auth.uid() OR is_admin_ti());
CREATE POLICY "Registra aceite" ON lgpd_aceites FOR INSERT WITH CHECK (usuario_id = auth.uid());

-- ─── Políticas: auditoria ────────────────────────────────────
CREATE POLICY "Vê auditoria do clube" ON auditoria_eventos FOR SELECT
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

CREATE POLICY "Registra auditoria" ON auditoria_eventos FOR INSERT
  WITH CHECK (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

-- ─── Políticas: pré-cadastros ────────────────────────────────
CREATE POLICY "Vê pré-cadastros do clube" ON pre_cadastros FOR SELECT
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

CREATE POLICY "Envia pré-cadastro (público)" ON pre_cadastros FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Gerencia pré-cadastros" ON pre_cadastros FOR UPDATE
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

-- ─── Políticas: convites ─────────────────────────────────────
CREATE POLICY "Vê convites do clube" ON convites_responsavel FOR SELECT
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti() OR membro_id IN (SELECT membros_como_responsavel()));

CREATE POLICY "Cria convites" ON convites_responsavel FOR INSERT
  WITH CHECK (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

CREATE POLICY "Aceita convite" ON convites_responsavel FOR UPDATE USING (TRUE);

-- ─── Políticas: classe bíblica ───────────────────────────────
CREATE POLICY "Vê próprias respostas" ON classe_biblica_respostas FOR SELECT
  USING (usuario_id = auth.uid() OR clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

CREATE POLICY "Salva respostas" ON classe_biblica_respostas FOR ALL
  USING (usuario_id = auth.uid());

-- ─── Políticas: arquivos ─────────────────────────────────────
CREATE POLICY "Vê arquivos do clube" ON arquivos_registro FOR SELECT
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

CREATE POLICY "Gerencia arquivos" ON arquivos_registro FOR ALL
  USING (clube_id IN (SELECT clubes_do_usuario()) OR is_admin_ti());

-- Tabelas sem RLS (globais, somente leitura)
ALTER TABLE programas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Programas públicos" ON programas FOR SELECT USING (TRUE);
ALTER TABLE classes_modelo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Classes públicas" ON classes_modelo FOR SELECT USING (TRUE);
ALTER TABLE cargos_modelo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cargos públicos" ON cargos_modelo FOR SELECT USING (TRUE);
ALTER TABLE documentos_modelo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Documentos modelo visíveis" ON documentos_modelo FOR SELECT USING (TRUE);
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vê próprio perfil" ON usuarios FOR SELECT USING (id = auth.uid() OR is_admin_ti() OR TRUE);
CREATE POLICY "Atualiza próprio perfil" ON usuarios FOR UPDATE USING (id = auth.uid());
