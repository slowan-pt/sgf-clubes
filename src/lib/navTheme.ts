import { useContextoStore } from '../stores/contextoStore';

export const CORES_PADRAO = {
  primaria: '#1a56db',
  secundaria: '#1e429f',
  texto: '#ffffff',
  fundo: '#f9fafb',
  card: '#ffffff',
  borda: '#e5e7eb',
  erro: '#ef4444',
  sucesso: '#22c55e',
  aviso: '#f59e0b',
};

export function useCores() {
  const contexto = useContextoStore((s) => s.contextoAtivo);
  const clube = useContextoStore((s) =>
    s.contextos.find((c) => c.clube_id === contexto?.clube_id),
  );
  return {
    ...CORES_PADRAO,
  };
}
