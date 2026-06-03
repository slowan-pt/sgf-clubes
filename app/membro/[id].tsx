import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { getClubeAtivoId } from '../../src/lib/contextoAtual';
import { usePermissoes } from '../../src/lib/permissoes';
import { Avatar } from '../../src/components/common/Avatar';
import { DateField } from '../../src/components/DateField';
import type { Membro, Documento, ProgressoClasse, Especialidade } from '../../src/types';

export default function FichaMembro() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { pode } = usePermissoes();
  const [membro, setMembro] = useState<Membro | null>(null);
  const [docs, setDocs] = useState<Documento[]>([]);
  const [classes, setClasses] = useState<ProgressoClasse[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<Partial<Membro>>({});
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<'dados' | 'docs' | 'formativo'>('dados');

  useEffect(() => { carregar(); }, [id]);

  async function carregar() {
    if (id === 'novo') {
      setMembro(null);
      setEditando(true);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    const [{ data: m }, { data: d }, { data: c }, { data: e }] = await Promise.all([
      supabase.from('desbravadores').select('*, unidade:unidades(id,nome,cor), cargo:cargos_modelo(id,nome_masculino,nome_feminino)').eq('id', id).single(),
      supabase.from('documentos').select('*, documento_modelo:documentos_modelo(*), imagens:documento_imagens(*)').eq('membro_id', id),
      supabase.from('progresso_classes').select('*, classe:classes_modelo(id,nome,ordem)').eq('membro_id', id),
      supabase.from('especialidades').select('*').eq('membro_id', id),
    ]);

    setMembro(m as Membro);
    setForm(m as Membro);
    setDocs((d as Documento[]) ?? []);
    setClasses((c as ProgressoClasse[]) ?? []);
    setEspecialidades((e as Especialidade[]) ?? []);
    setCarregando(false);
  }

  async function salvar() {
    const clube_id = getClubeAtivoId();

    if (id === 'novo') {
      const { data, error } = await supabase
        .from('desbravadores')
        .insert({ ...form, clube_id, ativo: true })
        .select()
        .single();

      if (error) { Alert.alert('Erro ao salvar', error.message); return; }
      router.replace(`/membro/${data.id}` as any);
      return;
    }

    const { error } = await supabase
      .from('desbravadores')
      .update(form)
      .eq('id', id);

    if (error) { Alert.alert('Erro ao salvar', error.message); return; }

    setEditando(false);
    carregar();
  }

  async function inativar() {
    Alert.alert('Inativar membro?', 'O histórico será preservado.', [
      { text: 'Cancelar' },
      {
        text: 'Inativar', style: 'destructive',
        onPress: async () => {
          await supabase.from('desbravadores').update({ ativo: false }).eq('id', id);
          router.back();
        },
      },
    ]);
  }

  if (carregando) {
    return <View style={styles.centro}><ActivityIndicator color="#1a56db" /></View>;
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.cabecalhoTitulo}>
          {id === 'novo' ? 'Novo Membro' : membro?.nome ?? 'Ficha'}
        </Text>
        {pode('gerenciar_membros') && (
          <TouchableOpacity onPress={() => (editando ? salvar() : setEditando(true))}>
            <Text style={styles.cabecalhoAcao}>{editando ? 'Salvar' : 'Editar'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {id !== 'novo' && (
        <View style={styles.perfil}>
          <Avatar nome={membro?.nome ?? ''} url={membro?.foto_url} tamanho={72} />
          <View style={styles.perfilInfo}>
            <Text style={styles.perfilNome}>{membro?.nome}</Text>
            <Text style={styles.perfilSub}>
              {(membro as any)?.unidade?.nome ?? 'Sem unidade'} •{' '}
              {(membro as any)?.cargo?.nome_masculino ?? 'Sem cargo'}
            </Text>
            <View style={[styles.badge, { backgroundColor: membro?.ativo ? '#dcfce7' : '#fee2e2' }]}>
              <Text style={[styles.badgeTexto, { color: membro?.ativo ? '#15803d' : '#dc2626' }]}>
                {membro?.ativo ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {id !== 'novo' && (
        <View style={styles.abas}>
          {(['dados', 'docs', 'formativo'] as const).map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.aba, aba === a && styles.abaAtiva]}
              onPress={() => setAba(a)}
            >
              <Text style={[styles.abaTexto, aba === a && styles.abaTextoAtivo]}>
                {a === 'dados' ? 'Dados' : a === 'docs' ? 'Documentos' : 'Formativo'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.corpo}>
        {(aba === 'dados' || id === 'novo') && (
          <View style={styles.secao}>
            {editando ? (
              <>
                <CampoEditar label="Nome" value={form.nome} onChange={(v) => setForm((f) => ({ ...f, nome: v }))} />
                <DateField label="Nascimento" value={form.data_nascimento} onChange={(v) => setForm((f) => ({ ...f, data_nascimento: v }))} />
                <CampoEditar label="E-mail" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
                <CampoEditar label="Telefone" value={form.telefone} onChange={(v) => setForm((f) => ({ ...f, telefone: v }))} />
                <CampoEditar label="Nome do responsável" value={form.nome_responsavel} onChange={(v) => setForm((f) => ({ ...f, nome_responsavel: v }))} />
                <CampoEditar label="Contato do responsável" value={form.contato_responsavel} onChange={(v) => setForm((f) => ({ ...f, contato_responsavel: v }))} />
                {id === 'novo' && (
                  <TouchableOpacity style={styles.botaoSalvar} onPress={salvar}>
                    <Text style={styles.botaoSalvarTexto}>Criar Membro</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <CampoVisivel label="Nascimento" value={membro?.data_nascimento ? new Date(membro.data_nascimento + 'T00:00').toLocaleDateString('pt-BR') : '—'} />
                <CampoVisivel label="E-mail" value={membro?.email} />
                <CampoVisivel label="Telefone" value={membro?.telefone} />
                <CampoVisivel label="Responsável" value={membro?.nome_responsavel} />
                <CampoVisivel label="Contato" value={membro?.contato_responsavel} />
                {pode('gerenciar_membros') && membro?.ativo && (
                  <TouchableOpacity style={styles.botaoInativar} onPress={inativar}>
                    <Text style={styles.botaoInativarTexto}>Inativar membro</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {aba === 'docs' && (
          <View style={styles.secao}>
            {docs.length === 0 ? (
              <Text style={styles.vazio}>Nenhum documento cadastrado.</Text>
            ) : (
              docs.map((doc) => (
                <View key={doc.id} style={styles.docItem}>
                  <Text style={styles.docNome}>{(doc as any).documento_modelo?.nome}</Text>
                  <View style={[styles.docStatus, {
                    backgroundColor: doc.status === 'OK' ? '#dcfce7' : doc.status === 'NA' ? '#f3f4f6' : '#fee2e2',
                  }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: doc.status === 'OK' ? '#15803d' : doc.status === 'NA' ? '#6b7280' : '#dc2626' }}>
                      {doc.status}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {aba === 'formativo' && (
          <View style={styles.secao}>
            <Text style={styles.subTitulo}>Classes</Text>
            {classes.map((c) => (
              <View key={c.id} style={styles.formativoItem}>
                <Text style={styles.formativoNome}>{(c as any).classe?.nome}</Text>
                <Text style={styles.formativoStatus}>{c.status}</Text>
              </View>
            ))}
            <Text style={[styles.subTitulo, { marginTop: 16 }]}>Especialidades</Text>
            {especialidades.map((e) => (
              <View key={e.id} style={styles.formativoItem}>
                <Text style={styles.formativoNome}>{e.nome}</Text>
                <Text style={styles.formativoStatus}>{e.status}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function CampoVisivel({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      <Text style={styles.campoValor}>{value ?? '—'}</Text>
    </View>
  );
}

function CampoEditar({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.campoEdit}>
      <Text style={styles.campoLabel}>{label}</Text>
      <TextInput
        style={styles.campoInput}
        value={value ?? ''}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor="#9ca3af"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cabecalho: {
    backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  cabecalhoTitulo: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
  cabecalhoAcao: { fontSize: 15, color: '#bfdbfe', fontWeight: '600' },
  perfil: { backgroundColor: '#fff', padding: 20, flexDirection: 'row', gap: 16, alignItems: 'center' },
  perfilInfo: { flex: 1, gap: 4 },
  perfilNome: { fontSize: 18, fontWeight: '700', color: '#111827' },
  perfilSub: { fontSize: 13, color: '#6b7280' },
  badge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  badgeTexto: { fontSize: 11, fontWeight: '700' },
  abas: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  aba: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  abaAtiva: { borderBottomWidth: 2, borderBottomColor: '#1a56db' },
  abaTexto: { fontSize: 13, color: '#6b7280' },
  abaTextoAtivo: { color: '#1a56db', fontWeight: '700' },
  corpo: { padding: 16 },
  secao: { gap: 12 },
  subTitulo: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 },
  campo: { gap: 2 },
  campoLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' },
  campoValor: { fontSize: 15, color: '#111827' },
  campoEdit: { gap: 4 },
  campoInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827', backgroundColor: '#fff' },
  botaoSalvar: { backgroundColor: '#1a56db', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  botaoSalvarTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  botaoInativar: { borderWidth: 1, borderColor: '#ef4444', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 16 },
  botaoInativarTexto: { color: '#ef4444', fontWeight: '600' },
  docItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  docNome: { fontSize: 14, color: '#111827', flex: 1 },
  docStatus: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  formativoItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  formativoNome: { fontSize: 14, color: '#111827' },
  formativoStatus: { fontSize: 13, color: '#6b7280' },
  vazio: { color: '#9ca3af', textAlign: 'center', marginTop: 20 },
});
