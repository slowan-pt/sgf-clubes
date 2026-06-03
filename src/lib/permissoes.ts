import { useCallback } from 'react';
import { useContextoStore } from '../stores/contextoStore';
import type { Perfil, Permissao } from '../types';

const MATRIZ: Record<Perfil, Permissao[]> = {
  admin_ti: [
    'admin_plataforma','admin_clube','gerenciar_acessos','gerenciar_clubes',
    'gerenciar_membros','gerenciar_pontuacao','gerenciar_unidades','gerenciar_agenda',
    'gerenciar_atividades','enviar_mensagens','ver_relatorios','ver_financeiro',
    'ver_filhos','ver_unidade',
  ],
  admin_clube: [
    'admin_clube','gerenciar_acessos','gerenciar_membros','gerenciar_pontuacao',
    'gerenciar_unidades','gerenciar_agenda','gerenciar_atividades','enviar_mensagens',
    'ver_relatorios','ver_financeiro','ver_filhos','ver_unidade',
  ],
  usuario_secretaria: [
    'gerenciar_membros','gerenciar_documentos','gerenciar_agenda','gerenciar_atividades',
    'enviar_mensagens','ver_relatorios','ver_unidade',
  ],
  usuario_tesouraria: ['ver_relatorios','ver_financeiro'],
  usuario_conselheiro: [
    'gerenciar_pontuacao','gerenciar_agenda','gerenciar_atividades',
    'ver_relatorios','ver_unidade',
  ],
  usuario_diretoria: [
    'gerenciar_membros','gerenciar_pontuacao','gerenciar_unidades','gerenciar_agenda',
    'gerenciar_atividades','enviar_mensagens','ver_relatorios','ver_financeiro',
    'ver_filhos','ver_unidade',
  ],
  usuario_capelao: ['gerenciar_atividades','enviar_mensagens','ver_relatorios','ver_unidade'],
  usuario_regional: ['ver_relatorios','ver_unidade'],
  usuario_distrital: ['ver_relatorios','ver_unidade'],
  usuario_pastor: ['ver_relatorios','ver_unidade'],
  usuario_desbravador: [],
  usuario_aventureiro: [],
  usuario_pais: ['ver_filhos'],
  responsavel: ['ver_filhos'],
};

export function getPermissoes(perfis: Perfil[]): Set<Permissao> {
  const set = new Set<Permissao>();
  for (const p of perfis) {
    for (const perm of MATRIZ[p] ?? []) {
      set.add(perm);
    }
  }
  return set;
}

export function usePermissoes() {
  const contexto = useContextoStore((s) => s.contextoAtivo);

  const perfis: Perfil[] = contexto ? [contexto.perfil] : [];
  const permissoes = getPermissoes(perfis);

  const pode = useCallback(
    (p: Permissao) => permissoes.has(p),
    [permissoes],
  );

  const podeAlguma = useCallback(
    (...ps: Permissao[]) => ps.some((p) => permissoes.has(p)),
    [permissoes],
  );

  const temPerfil = useCallback(
    (p: Perfil) => perfis.includes(p),
    [perfis],
  );

  return { pode, podeAlguma, temPerfil, permissoes };
}
