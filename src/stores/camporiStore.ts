import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getClubeAtivoId } from '../lib/contextoAtual';
import type { ConfigCampori, ParcelaCamporiConfig, PagamentoCampori } from '../types';

interface CamporiState {
  config: ConfigCampori | null;
  parcelas: ParcelaCamporiConfig[];
  pagamentos: PagamentoCampori[];
  carregando: boolean;
  carregar: () => Promise<void>;
  registrarPagamento: (membroId: number, parcelaId: number, valor: number) => Promise<void>;
}

export const useCamporiStore = create<CamporiState>((set) => ({
  config: null,
  parcelas: [],
  pagamentos: [],
  carregando: false,

  carregar: async () => {
    const clube_id = getClubeAtivoId();
    if (!clube_id) return;

    set({ carregando: true });

    const [{ data: cfg }, { data: parcelas }, { data: pagamentos }] = await Promise.all([
      supabase.from('config_campori').select('*').eq('clube_id', clube_id).single(),
      supabase.from('parcelas_campori_config').select('*').eq('clube_id', clube_id).order('numero'),
      supabase.from('pagamentos_campori').select('*').eq('clube_id', clube_id),
    ]);

    set({
      config: cfg as ConfigCampori,
      parcelas: (parcelas as ParcelaCamporiConfig[]) ?? [],
      pagamentos: (pagamentos as PagamentoCampori[]) ?? [],
      carregando: false,
    });
  },

  registrarPagamento: async (membroId, parcelaId, valor) => {
    const clube_id = getClubeAtivoId();
    if (!clube_id) return;

    const { data } = await supabase
      .from('pagamentos_campori')
      .insert({
        clube_id,
        membro_id: membroId,
        parcela_id: parcelaId,
        valor_pago: valor,
        data_pagamento: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (data) {
      set((s) => ({ pagamentos: [...s.pagamentos, data as PagamentoCampori] }));
    }
  },
}));
