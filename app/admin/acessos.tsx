import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { getClubeAtivoId } from '../../src/lib/contextoAtual';
import { Avatar } from '../../src/components/common/Avatar';

const PERFIS = [
  'admin_clube','usuario_secretaria','usuario_tesouraria','usuario_conselheiro',
  'usuario_diretoria','usuario_capelao','usuario_regional','usuario_distrital','usuario_pastor',
];

export default function Acessos() {
  const router = useRouter();
  const [vinculos, setVinculos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ email: '', perfil: PERFIS[0] });

  useFocusEffect(React.useCallback(() => { carregar(); }, []));

  async function carregar() {
    const clube_id = getClubeAtivoId();
    if (!clube_id) return;
    setCarregando(true);
    const { data } = await supabase
      .from('usuario_clubes')
      .select('*, usuario:usuarios(id, email, nome, foto_url)')
      .eq('clube_id', clube_id)
      .eq('ativo', true);
    setVinculos(data ?? []);
    setCarregando(false);
  }

  async function convidar() {
    const clube_id = getClubeAtivoId();
    if (!form.email) { Alert.alert('Informe o e-mail.'); return; }

    const { data: user } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', form.email)
      .single();

    if (!user) { Alert.alert('Usuário não encontrado. O usuário precisa ter uma conta.'); return; }

    await supabase.from('usuario_clubes').upsert({
      usuario_id: user.id,
      clube_id,
      perfil: form.perfil,
      ativo: true,
    });

    setModal(false);
    setForm({ email: '', perfil: PERFIS[0] });
    carregar();
  }

  async function remover(id: number) {
    Alert.alert('Remover acesso?', '', [
      { text: 'Cancelar' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          await supabase.from('usuario_clubes').update({ ativo: false }).eq('id', id);
          carregar();
        },
      },
    ]);
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Acessos</Text>
        <TouchableOpacity onPress={() => setModal(true)}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {carregando ? <ActivityIndicator style={{ marginTop: 40 }} color="#1a56db" /> : (
        <FlatList
          data={vinculos}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Avatar nome={item.usuario?.nome ?? item.usuario?.email ?? ''} url={item.usuario?.foto_url} tamanho={44} />
              <View style={styles.info}>
                <Text style={styles.nome}>{item.usuario?.nome ?? item.usuario?.email ?? '—'}</Text>
                <Text style={styles.perfil}>{item.perfil.replace('usuario_', '')}</Text>
              </View>
              <TouchableOpacity onPress={() => remover(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitulo}>Adicionar Acesso</Text>
          <TextInput
            style={styles.input}
            placeholder="E-mail do usuário"
            value={form.email}
            onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#9ca3af"
          />
          <Text style={styles.secao}>Perfil:</Text>
          {PERFIS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.perfilOpc, form.perfil === p && styles.perfilOpcAtivo]}
              onPress={() => setForm((f) => ({ ...f, perfil: p }))}
            >
              <Text style={[styles.perfilOpcTexto, form.perfil === p && styles.perfilOpcTextoAtivo]}>
                {p.replace('usuario_', '').replace('admin_', 'Admin ')}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.botao} onPress={convidar}>
            <Text style={styles.botaoTexto}>Adicionar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelar} onPress={() => setModal(false)}>
            <Text style={styles.cancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 18, fontWeight: '700', color: '#fff' },
  lista: { padding: 12, gap: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  nome: { fontSize: 15, fontWeight: '600', color: '#111827' },
  perfil: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  modal: { flex: 1, padding: 20, backgroundColor: '#fff' },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12, color: '#111827', backgroundColor: '#f9fafb' },
  secao: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  perfilOpc: { padding: 12, borderRadius: 8, backgroundColor: '#f3f4f6', marginBottom: 6 },
  perfilOpcAtivo: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  perfilOpcTexto: { fontSize: 14, color: '#374151' },
  perfilOpcTextoAtivo: { color: '#1a56db', fontWeight: '600' },
  botao: { backgroundColor: '#1a56db', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelar: { alignItems: 'center', padding: 12 },
  cancelarTexto: { color: '#6b7280', fontSize: 15 },
});
