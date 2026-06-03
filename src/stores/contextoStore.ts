import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { ContextoAcesso } from '../types';

const STORAGE_KEY = 'sgf_contexto_ativo';

interface ContextoState {
  contextos: ContextoAcesso[];
  contextoAtivo: ContextoAcesso | null;
  carregando: boolean;
  carregarContextos: (usuarioId: string) => Promise<void>;
  selecionarContexto: (ctx: ContextoAcesso) => void;
  limpar: () => void;
}

export const useContextoStore = create<ContextoState>((set, get) => ({
  contextos: [],
  contextoAtivo: null,
  carregando: false,

  carregarContextos: async (usuarioId: string) => {
    set({ carregando: true });

    const [{ data: vinculos }, { data: responsaveis }] = await Promise.all([
      supabase
        .from('usuario_clubes')
        .select('*, clube:clubes(id,nome,nome_curto,programa_id,cor_primaria,cor_secundaria), programa:programas(id,nome)')
        .eq('usuario_id', usuarioId)
        .eq('ativo', true),
      supabase
        .from('responsavel_membros')
        .select('*, membro:desbravadores(id,nome,clube_id,programa_id), clube:clubes(id,nome,programa_id)')
        .eq('usuario_id', usuarioId)
        .eq('ativo', true),
    ]);

    const contextos: ContextoAcesso[] = [];

    for (const v of vinculos ?? []) {
      const clube = v.clube as any;
      const prog = v.programa as any;
      contextos.push({
        tipo: 'clube',
        clube_id: v.clube_id,
        clube_nome: clube?.nome ?? '',
        programa_id: clube?.programa_id ?? 0,
        programa_nome: prog?.nome ?? '',
        perfil: v.perfil,
        unidade_id: v.unidade_id ?? undefined,
        label: `${v.perfil.replace('usuario_', '').replace('admin_', 'Admin ')} — ${clube?.nome_curto ?? clube?.nome ?? ''}`,
      });
    }

    for (const r of responsaveis ?? []) {
      const membro = r.membro as any;
      const clube = r.clube as any;
      contextos.push({
        tipo: 'responsavel',
        clube_id: r.clube_id,
        clube_nome: clube?.nome ?? '',
        programa_id: membro?.programa_id ?? 0,
        programa_nome: '',
        perfil: 'responsavel',
        membro_id: r.membro_id,
        membro_nome: membro?.nome ?? '',
        label: `Responsável por ${membro?.nome ?? ''} — ${clube?.nome ?? ''}`,
      });
    }

    // Restaura contexto salvo
    let contextoAtivo: ContextoAcesso | null = null;
    try {
      const saved = typeof window !== 'undefined'
        ? localStorage.getItem(STORAGE_KEY)
        : null;
      if (saved) {
        const parsed = JSON.parse(saved) as ContextoAcesso;
        contextoAtivo = contextos.find(
          (c) => c.clube_id === parsed.clube_id && c.perfil === parsed.perfil && c.membro_id === parsed.membro_id,
        ) ?? null;
      }
    } catch {
      // ignora
    }

    if (!contextoAtivo && contextos.length === 1) {
      contextoAtivo = contextos[0];
    }

    set({ contextos, contextoAtivo, carregando: false });
  },

  selecionarContexto: (ctx) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
    }
    set({ contextoAtivo: ctx });
  },

  limpar: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ contextos: [], contextoAtivo: null });
  },
}));
