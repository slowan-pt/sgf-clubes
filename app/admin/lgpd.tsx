import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { getClubeAtivoId } from '../../src/lib/contextoAtual';

export default function Lgpd() {
  const router = useRouter();
  const [termos, setTermos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ titulo: '', conteudo: '', versao: '1.0' });
  const [salvando, setSalvando] = useState(false);

  useFocusEffect(React.useCallback(() => { carregar(); }, []));

  async function carregar() {
    const clube_id = getClubeAtivoId();
    setCarregando(true);
    const { data } = await supabase.from('lgpd_termos').select('*').or(`clube_id.is.null,clube_id.eq.${clube_id}`).order('created_at', { ascending: false });
    setTermos(data ?? []);
    setCarregando(false);
  }

  async function salvar() {
    const clube_id = getClubeAtivoId();
    if (!form.titulo || !form.conteudo) { Alert.alert('Preencha todos os campos.'); return; }
    setSalvando(true);
    await supabase.from('lgpd_termos').update({ vigente: false }).eq('clube_id', clube_id);
    await supabase.from('lgpd_termos').insert({ ...form, clube_id, vigente: true });
    setSalvando(false);
    setModal(false);
    carregar();
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.titulo}>LGPD</Text>
        <TouchableOpacity onPress={() => setModal(true)}><Ionicons name="add" size={26} color="#fff" /></TouchableOpacity>
      </View>
      {carregando ? <ActivityIndicator style={{ marginTop: 40 }} color="#1a56db" /> : (
        <FlatList
          data={termos}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>{item.titulo}</Text>
              <Text style={styles.cardVersao}>v{item.versao}</Text>
              {item.vigente && <View style={styles.vigenteBadge}><Text style={styles.vigenteTexto}>Vigente</Text></View>}
            </View>
          )}
        />
      )}
      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitulo}>Novo Termo LGPD</Text>
          <TextInput style={styles.input} placeholder="Título" value={form.titulo} onChangeText={(v) => setForm((f) => ({ ...f, titulo: v }))} placeholderTextColor="#9ca3af" />
          <TextInput style={styles.input} placeholder="Versão (ex: 1.0)" value={form.versao} onChangeText={(v) => setForm((f) => ({ ...f, versao: v }))} placeholderTextColor="#9ca3af" />
          <TextInput style={[styles.input, { height: 200, textAlignVertical: 'top' }]} placeholder="Conteúdo do termo..." value={form.conteudo} onChangeText={(v) => setForm((f) => ({ ...f, conteudo: v }))} multiline placeholderTextColor="#9ca3af" />
          <TouchableOpacity style={[styles.botao, salvando && { opacity: 0.6 }]} onPress={salvar} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Salvar e tornar vigente</Text>}
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
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  cardTitulo: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardVersao: { fontSize: 12, color: '#6b7280' },
  vigenteBadge: { alignSelf: 'flex-start', backgroundColor: '#dcfce7', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  vigenteTexto: { fontSize: 11, color: '#15803d', fontWeight: '700' },
  modal: { flex: 1, padding: 20, backgroundColor: '#fff' },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 10, color: '#111827', backgroundColor: '#f9fafb' },
  botao: { backgroundColor: '#1a56db', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelar: { alignItems: 'center', padding: 12 },
  cancelarTexto: { color: '#6b7280', fontSize: 15 },
});
