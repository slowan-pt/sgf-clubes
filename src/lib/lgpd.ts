import { supabase } from './supabase';
import { getClubeAtivoId } from './contextoAtual';

export async function verificarConsentimento(usuarioId: string): Promise<boolean> {
  const clube_id = getClubeAtivoId();

  const { data: termos } = await supabase
    .from('lgpd_termos')
    .select('id')
    .eq('vigente', true)
    .or(`clube_id.is.null,clube_id.eq.${clube_id}`)
    .limit(1);

  if (!termos?.length) return true;

  const termoId = termos[0].id;

  const { data: aceite } = await supabase
    .from('lgpd_aceites')
    .select('id')
    .eq('usuario_id', usuarioId)
    .eq('termo_id', termoId)
    .limit(1);

  return (aceite?.length ?? 0) > 0;
}

export async function registrarAceite(usuarioId: string, termoId: number) {
  await supabase.from('lgpd_aceites').upsert({
    usuario_id: usuarioId,
    termo_id: termoId,
    aceito_em: new Date().toISOString(),
  });
}
