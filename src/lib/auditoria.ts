import { supabase } from './supabase';
import { getClubeAtivoId } from './contextoAtual';

export async function registrarAuditoria(
  acao: string,
  detalhes?: Record<string, unknown>,
  membro_id?: number,
) {
  const { data: { user } } = await supabase.auth.getUser();
  const clube_id = getClubeAtivoId();

  await supabase.from('auditoria_eventos').insert({
    clube_id,
    usuario_id: user?.id,
    membro_id,
    acao,
    detalhes,
  });
}
