import { useContextoStore } from '../stores/contextoStore';

export function getClubeAtivoId(): number | null {
  return useContextoStore.getState().contextoAtivo?.clube_id ?? null;
}

export function getProgramaAtivoId(): number | null {
  return useContextoStore.getState().contextoAtivo?.programa_id ?? null;
}

export function getContextoMembroId(): number | null {
  return useContextoStore.getState().contextoAtivo?.membro_id ?? null;
}

export function getContextoUnidadeId(): number | null {
  return useContextoStore.getState().contextoAtivo?.unidade_id ?? null;
}

export function getContextoPerfil() {
  return useContextoStore.getState().contextoAtivo?.perfil ?? null;
}

export function isResponsavel(): boolean {
  return useContextoStore.getState().contextoAtivo?.tipo === 'responsavel';
}
