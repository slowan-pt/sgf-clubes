import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getClubeAtivoId } from '../lib/contextoAtual';
import type { PontuacaoItem, Pontuacao } from '../types';

interface PontuacaoState {
  itens: PontuacaoItem[];
  pontuacoes: Pontuacao[];
  carregando: boolean;
  carregarItens: () => Promise<void>;
  carregarPontuacoes: (dataInicio?: string, dataFim?: string) => Promise<void>;
  lancar: (membroId: number, data: string, itensMarcados: number[]) => Promise<void>;
  descontar: (membroIds: number[], itemId: number, data: string) => Promise<void>;
}

export const usePontuacaoStore = create<PontuacaoState>((set) => ({
  itens: [],
  pontuacoes: [],
  carregando: false,

  carregarItens: async () => {
    const clube_id = getClubeAtivoId();
    if (!clube_id) return;

    const { data } = await supabase
      .from('pontuacao_itens')
      .select('*')
      .eq('clube_id', clube_id)
      .eq('ativo', true)
      .order('ordem');

    set({ itens: (data as PontuacaoItem[]) ?? [] });
  },

  carregarPontuacoes: async (dataInicio, dataFim) => {
    const clube_id = getClubeAtivoId();
    if (!clube_id) return;

    set({ carregando: true });
    let query = supabase
      .from('pontuacoes')
      .select('*, itens:pontuacao_lancamentos(*)')
      .eq('clube_id', clube_id);

    if (dataInicio) query = query.gte('data', dataInicio);
    if (dataFim) query = query.lte('data', dataFim);

    const { data } = await query.order('data', { ascending: false });
    set({ pontuacoes: (data as Pontuacao[]) ?? [], carregando: false });
  },

  lancar: async (membroId, data, itensMarcados) => {
    const clube_id = getClubeAtivoId();
    if (!clube_id) return;

    const { data: pont } = await supabase
      .from('pontuacoes')
      .insert({ clube_id, membro_id: membroId, data })
      .select()
      .single();

    if (!pont) return;

    const store = usePontuacaoStore.getState();
    const lancamentos = itensMarcados.map((itemId) => {
      const item = store.itens.find((i) => i.id === itemId);
      return {
        pontuacao_id: pont.id,
        pontuacao_item_id: itemId,
        valor_aplicado: item?.valor ?? 0,
      };
    });

    if (lancamentos.length) {
      await supabase.from('pontuacao_lancamentos').insert(lancamentos);
    }
  },

  descontar: async (membroIds, itemId, data) => {
    const clube_id = getClubeAtivoId();
    if (!clube_id) return;

    const store = usePontuacaoStore.getState();
    const item = store.itens.find((i) => i.id === itemId);

    for (const membroId of membroIds) {
      const { data: pont } = await supabase
        .from('pontuacoes')
        .insert({ clube_id, membro_id: membroId, data })
        .select()
        .single();

      if (pont) {
        await supabase.from('pontuacao_lancamentos').insert({
          pontuacao_id: pont.id,
          pontuacao_item_id: itemId,
          valor_aplicado: -(item?.valor ?? 0),
        });
      }
    }
  },
}));
