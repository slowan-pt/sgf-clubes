import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  carregando: boolean;
  mfaVerificado: boolean;
  lgpdAceito: boolean;
  setSession: (session: Session | null) => void;
  setMfaVerificado: (v: boolean) => void;
  setLgpdAceito: (v: boolean) => void;
  logout: () => Promise<void>;
  inicializar: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  carregando: true,
  mfaVerificado: false,
  lgpdAceito: false,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, carregando: false }),

  setMfaVerificado: (mfaVerificado) => set({ mfaVerificado }),

  setLgpdAceito: (lgpdAceito) => set({ lgpdAceito }),

  logout: async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sgf_contexto_ativo');
    }
    set({ session: null, user: null, mfaVerificado: false, lgpdAceito: false });
  },

  inicializar: async () => {
    set({ carregando: true });
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, carregando: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },
}));
