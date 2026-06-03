import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';

export default function Clubes() {
  const router = useRouter();
  const [clubes, setClubes] = useState<any[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: '', nome_curto: '', programa_id: 1, cor_primaria: '#1a56db', cor_secundaria: '#1e429f' });
  const [salvando, setSalvando] = useState(false);

  useFocusEffect(React.useCallback(() => { carregar(); }, []));

  async function carregar() {
    setCarregando(true);
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('clubes').select('*, programa:programas(nome)').order('nome'),
      supabase.from('programas').select('*').eq('ativo', true),
    ]);
    setClubes(c ?? []);
    setProgramas(p ?? []);
    if (p?.length) setForm((f) => ({ ...f, programa_id: p[0].id }));
    setCarregando(false);
  }

  async function salvar() {
    if (!form.nome) { Alert.alert('Informe o nome do clube.'); return; }
    setSalvando(true);
    await supabase.from('clubes').insert({ ...form, ativo: true });
    setSalvando(false);
    setModal(false);
    carregar();
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.titulo}>Clubes</Text>
        <TouchableOpacity onPress={() => setModal(true)}><Ionicons name="add" size={26} color="#fff" /></TouchableOpacity>
      </View>
      {carregando ? <ActivityIndicator style={{ marginTop: 40 }} color="#1a56db" /> : (
        <FlatList
          data={clubes}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={[styles.card, { borderLeftColor: item.cor_primaria, borderLeftWidth: 5 }]}>
              <Text style={styles.nome}>{item.nome}</Text>
              <Text style={styles.programa}>{item.programa?.nome}</Text>
              <View style={[styles.badge, { backgroundColor: item.ativo ? '#dcfce7' : '#fee2e2' }]}>
                <Text style={{ fontSize: 11, color: item.ativo ? '#15803d' : '#dc2626', fontWeight: '700' }}>{item.ativo ? 'Ativo' : 'Inativo'}</Text>
              </View>
            </View>
          )}
        />
      )}
      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitulo}>Novo Clube</Text>
          <TextInput style={styles.input} placeholder="Nome" value={form.nome} onChangeText={(v) => setForm((f) => ({ ...f, nome: v }))} placeholderTextColor="#9ca3af" />
          <TextInput style={styles.input} placeholder="Nome curto" value={form.nome_curto} onChangeText={(v) => setForm((f) => ({ ...f, nome_curto: v }))} placeholderTextColor="#9ca3af" />
          <Text style={styles.label}>Programa:</Text>
          {programas.map((p) => (
            <TouchableOpacity key={p.id} style={[styles.opcao, form.programa_id === p.id && styles.opcaoAtiva]} onPress={() => setForm((f) => ({ ...f, programa_id: p.id }))}>
              <Text style={[styles.opcaoTexto, form.programa_id === p.id && styles.opcaoTextoAtivo]}>{p.nome}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.botao, salvando && { opacity: 0.6 }]} onPress={salvar} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Criar Clube</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelar} onPress={() => setModal(false)}><Text style={styles.cancelarTexto}>Cancelar</Text></TouchableOpacity>
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
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 4 },
  nome: { fontSize: 15, fontWeight: '700', color: '#111827' },
  programa: { fontSize: 12, color: '#6b7280' },
  badge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  modal: { flex: 1, padding: 20, backgroundColor: '#fff' },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 10, color: '#111827', backgroundColor: '#f9fafb' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  opcao: { padding: 12, borderRadius: 8, backgroundColor: '#f3f4f6', marginBottom: 6 },
  opcaoAtiva: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  opcaoTexto: { fontSize: 14, color: '#374151' },
  opcaoTextoAtivo: { color: '#1a56db', fontWeight: '600' },
  botao: { backgroundColor: '#1a56db', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelar: { alignItems: 'center', padding: 12 },
  cancelarTexto: { color: '#6b7280', fontSize: 15 },
});
