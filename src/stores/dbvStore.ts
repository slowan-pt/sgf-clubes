import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getClubeAtivoId } from '../lib/contextoAtual';
import type { Membro } from '../types';

interface DbvState {
  membros: Membro[];
  carregando: boolean;
  carregar: () => Promise<void>;
  adicionar: (m: Partial<Membro>) => Promise<Membro | null>;
  atualizar: (id: number, dados: Partial<Membro>) => Promise<void>;
  inativar: (id: number) => Promise<void>;
}

export const useDbvStore = create<DbvState>((set) => ({
  membros: [],
  carregando: false,

  carregar: async () => {
    const clube_id = getClubeAtivoId();
    if (!clube_id) return;

    set({ carregando: true });
    const { data } = await supabase
      .from('desbravadores')
      .select('*, unidade:unidades(id,nome,cor), cargo:cargos_modelo(id,nome_masculino,nome_feminino)')
      .eq('clube_id', clube_id)
      .order('nome');

    set({ membros: (data as Membro[]) ?? [], carregando: false });
  },

  adicionar: async (dados) => {
    const clube_id = getClubeAtivoId();
    const { data, error } = await supabase
      .from('desbravadores')
      .insert({ ...dados, clube_id })
      .select()
      .single();

    if (error) return null;

    set((s) => ({ membros: [...s.membros, data as Membro] }));
    return data as Membro;
  },

  atualizar: async (id, dados) => {
    await supabase.from('desbravadores').update(dados).eq('id', id);
    set((s) => ({
      membros: s.membros.map((m) => (m.id === id ? { ...m, ...dados } : m)),
    }));
  },

  inativar: async (id) => {
    await supabase.from('desbravadores').update({ ativo: false }).eq('id', id);
    set((s) => ({
      membros: s.membros.map((m) => (m.id === id ? { ...m, ativo: false } : m)),
    }));
  },
}));
