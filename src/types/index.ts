// ─── Perfis de acesso ───────────────────────────────────────────────────────
export type Perfil =
  | 'admin_ti'
  | 'admin_clube'
  | 'usuario_secretaria'
  | 'usuario_tesouraria'
  | 'usuario_conselheiro'
  | 'usuario_diretoria'
  | 'usuario_capelao'
  | 'usuario_regional'
  | 'usuario_distrital'
  | 'usuario_pastor'
  | 'usuario_desbravador'
  | 'usuario_aventureiro'
  | 'usuario_pais'
  | 'responsavel';

// ─── Permissões ──────────────────────────────────────────────────────────────
export type Permissao =
  | 'admin_plataforma'
  | 'admin_clube'
  | 'gerenciar_acessos'
  | 'gerenciar_clubes'
  | 'gerenciar_membros'
  | 'gerenciar_documentos'
  | 'gerenciar_pontuacao'
  | 'gerenciar_unidades'
  | 'gerenciar_agenda'
  | 'gerenciar_atividades'
  | 'enviar_mensagens'
  | 'ver_relatorios'
  | 'ver_financeiro'
  | 'ver_filhos'
  | 'ver_unidade';

// ─── Contexto de acesso ──────────────────────────────────────────────────────
export type ContextoTipo = 'clube' | 'responsavel';

export interface ContextoAcesso {
  tipo: ContextoTipo;
  clube_id: number;
  clube_nome: string;
  programa_id: number;
  programa_nome: string;
  perfil: Perfil;
  unidade_id?: number;
  membro_id?: number;
  membro_nome?: string;
  label: string;
}

// ─── Entidades do banco ──────────────────────────────────────────────────────
export interface Programa {
  id: number;
  codigo: string;
  nome: string;
  idade_minima_membro: number;
  idade_maxima_membro: number;
  idade_minima_diretoria: number;
  ativo: boolean;
}

export interface Clube {
  id: number;
  programa_id: number;
  nome: string;
  nome_curto: string;
  codigo?: string;
  igreja?: string;
  distrito?: string;
  regional?: string;
  cidade?: string;
  uf?: string;
  logo_url?: string;
  cor_primaria: string;
  cor_secundaria: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  foto_url?: string;
  ativo: boolean;
  created_at: string;
}

export interface UsuarioClube {
  id: number;
  usuario_id: string;
  clube_id: number;
  membro_id?: number;
  perfil: Perfil;
  unidade_id?: number;
  ativo: boolean;
  created_at: string;
}

export interface ResponsavelMembro {
  id: number;
  usuario_id: string;
  membro_id: number;
  clube_id: number;
  programa_id: number;
  parentesco?: string;
  responsavel_principal: boolean;
  pode_visualizar: boolean;
  pode_visualizar_documentos: boolean;
  pode_enviar_documentos: boolean;
  pode_responder_atividades: boolean;
  ativo: boolean;
}

// ─── Membros ─────────────────────────────────────────────────────────────────
export interface Membro {
  id: number;
  clube_id: number;
  programa_id: number;
  unidade_id?: number;
  nome: string;
  data_nascimento?: string;
  genero?: 'M' | 'F';
  cargo_id?: number;
  cargo_adicional_id?: number;
  email?: string;
  telefone?: string;
  nome_responsavel?: string;
  contato_responsavel?: string;
  foto_url?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // joins
  unidade?: Unidade;
  cargo?: CargoModelo;
}

export interface Unidade {
  id: number;
  clube_id: number;
  nome: string;
  cor: string;
  ativo: boolean;
}

export interface CargoModelo {
  id: number;
  programa_id: number;
  codigo: string;
  nome_masculino: string;
  nome_feminino: string;
  tipo: string;
  ativo: boolean;
}

export interface ClasseModelo {
  id: number;
  programa_id: number;
  nome: string;
  ordem: number;
  tipo?: string;
  ativo: boolean;
}

// ─── Documentos ──────────────────────────────────────────────────────────────
export interface DocumentoModelo {
  id: number;
  clube_id?: number;
  programa_id?: number;
  nome: string;
  obrigatorio: boolean;
  permite_anexo: boolean;
  limite_anexos: number;
  ordem: number;
  ativo: boolean;
}

export interface Documento {
  id: number;
  membro_id: number;
  clube_id: number;
  documento_modelo_id: number;
  status: 'OK' | 'NOK' | 'NA';
  observacao?: string;
  documento_modelo?: DocumentoModelo;
  imagens?: DocumentoImagem[];
}

export interface DocumentoImagem {
  id: number;
  documento_id: number;
  clube_id: number;
  membro_id: number;
  url: string;
  tipo?: string;
  nome_arquivo?: string;
  created_at: string;
}

// ─── Pontuação ───────────────────────────────────────────────────────────────
export interface PontuacaoItem {
  id: number;
  clube_id: number;
  titulo: string;
  sigla: string;
  valor: number;
  ativo: boolean;
  ordem: number;
  padrao: boolean;
}

export interface Pontuacao {
  id: number;
  clube_id: number;
  membro_id: number;
  data: string;
  lancado_por?: string;
  observacao?: string;
  itens?: PontuacaoLancamento[];
}

export interface PontuacaoLancamento {
  id: number;
  pontuacao_id: number;
  pontuacao_item_id: number;
  valor_aplicado: number;
  observacao?: string;
}

// ─── Atividades ───────────────────────────────────────────────────────────────
export type StatusAtividade = 'aberta' | 'entregue' | 'em_correcao' | 'aprovada' | 'encerrada';

export interface Atividade {
  id: number;
  clube_id: number;
  titulo: string;
  descricao?: string;
  prazo?: string;
  criado_por?: string;
  avaliador_id?: string;
  item_formativo_tipo?: 'classe' | 'especialidade';
  item_formativo_id?: number;
  gera_investidura: boolean;
  plano_formativo_id?: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  alvos?: AtividadeAlvo[];
  anexos?: AtividadeAnexo[];
  respostas?: AtividadeResposta[];
}

export interface AtividadeAlvo {
  id: number;
  atividade_id: number;
  tipo: 'clube' | 'unidade' | 'membro';
  referencia_id?: number;
}

export interface AtividadeResposta {
  id: number;
  atividade_id: number;
  membro_id: number;
  status: StatusAtividade;
  texto?: string;
  nota?: number;
  avaliacao?: string;
  created_at: string;
  updated_at: string;
  membro?: Membro;
}

export interface AtividadeAnexo {
  id: number;
  atividade_id: number;
  url: string;
  nome_arquivo?: string;
  tipo?: string;
}

export interface AtividadeMensagem {
  id: number;
  atividade_id: number;
  autor_tipo: 'sistema' | 'avaliador' | 'membro';
  autor_id?: string;
  texto: string;
  created_at: string;
}

// ─── Eventos ──────────────────────────────────────────────────────────────────
export interface Evento {
  id: number;
  clube_id: number;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  horario?: string;
  local?: string;
  responsavel?: string;
  apoio?: string;
  material?: string;
  observacoes?: string;
  created_at: string;
}

// ─── Mensagens ────────────────────────────────────────────────────────────────
export interface MensagemClube {
  id: number;
  clube_id: number;
  titulo: string;
  corpo: string;
  autor_id?: string;
  created_at: string;
  lido?: boolean;
  oculto?: boolean;
}

// ─── Campori ──────────────────────────────────────────────────────────────────
export interface ConfigCampori {
  id: number;
  clube_id: number;
  num_parcelas: number;
  dia_vencimento: number;
}

export interface ParcelaCamporiConfig {
  id: number;
  clube_id: number;
  config_campori_id: number;
  numero: number;
  valor: number;
  descricao?: string;
  vencimento?: string;
}

export interface PagamentoCampori {
  id: number;
  clube_id: number;
  membro_id: number;
  parcela_id: number;
  valor_pago: number;
  data_pagamento: string;
  observacao?: string;
}

// ─── Progresso ────────────────────────────────────────────────────────────────
export interface ProgressoClasse {
  id: number;
  membro_id: number;
  clube_id: number;
  classe_id: number;
  status: 'pendente' | 'entregue' | 'aprovada' | 'pronto';
  data_conclusao?: string;
  observacao?: string;
  classe?: ClasseModelo;
}

export interface Especialidade {
  id: number;
  membro_id: number;
  clube_id: number;
  nome: string;
  categoria?: string;
  status: 'pendente' | 'entregue' | 'aprovada';
  data_conclusao?: string;
  atividade_id?: number;
}

// ─── LGPD ─────────────────────────────────────────────────────────────────────
export interface LgpdTermo {
  id: number;
  clube_id?: number;
  titulo: string;
  conteudo: string;
  versao: string;
  vigente: boolean;
  created_at: string;
}

export interface LgpdAceite {
  id: number;
  usuario_id: string;
  termo_id: number;
  aceito_em: string;
  ip?: string;
}

// ─── Pré-cadastro ─────────────────────────────────────────────────────────────
export interface PreCadastro {
  id: number;
  clube_id: number;
  token: string;
  nome: string;
  email?: string;
  telefone?: string;
  data_nascimento?: string;
  status: 'pendente' | 'aprovado' | 'recusado';
  created_at: string;
}

// ─── Auditoria ────────────────────────────────────────────────────────────────
export interface AuditoriaEvento {
  id: number;
  clube_id?: number;
  usuario_id?: string;
  membro_id?: number;
  acao: string;
  detalhes?: Record<string, unknown>;
  created_at: string;
}
