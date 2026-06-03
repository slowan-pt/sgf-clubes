import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, Switch, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { getClubeAtivoId, getProgramaAtivoId } from '../../src/lib/contextoAtual';
import { usePontuacaoStore } from '../../src/stores/pontuacaoStore';

export default function Modelos() {
  const router = useRouter();
  const { itens, carregarItens } = usePontuacaoStore();
  const [aba, setAba] = useState<'pontuacao' | 'documentos'>('pontuacao');
  const [docs, setDocs] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [modal, setModal] = useState<'pont' | 'doc' | null>(null);
  const [formPont, setFormPont] = useState({ titulo: '', sigla: '', valor: '' });
  const [formDoc, setFormDoc] = useState({ nome: '', obrigatorio: true, permite_anexo: true, limite_anexos: '3' });

  useFocusEffect(React.useCallback(() => {
    carregarItens();
    carregarDocs();
  }, []));

  async function carregarDocs() {
    const clube_id = getClubeAtivoId();
    const { data } = await supabase.from('documentos_modelo').select('*').or(`clube_id.is.null,clube_id.eq.${clube_id}`).eq('ativo', true).order('ordem');
    setDocs(data ?? []);
  }

  async function salvarPont() {
    if (!formPont.titulo || !formPont.sigla || !formPont.valor) { Alert.alert('Preencha todos os campos.'); return; }
    const clube_id = getClubeAtivoId();
    await supabase.from('pontuacao_itens').insert({ clube_id, titulo: formPont.titulo, sigla: formPont.sigla, valor: Number(formPont.valor), ativo: true, padrao: false, ordem: itens.length + 1 });
    setModal(null);
    setFormPont({ titulo: '', sigla: '', valor: '' });
    carregarItens();
  }

  async function salvarDoc() {
    if (!formDoc.nome) { Alert.alert('Informe o nome do documento.'); return; }
    const clube_id = getClubeAtivoId();
    const programa_id = getProgramaAtivoId();
    await supabase.from('documentos_modelo').insert({ clube_id, programa_id, ...formDoc, limite_anexos: Number(formDoc.limite_anexos), ativo: true, ordem: docs.length + 1 });
    setModal(null);
    carregarDocs();
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.titulo}>Modelos</Text>
        <TouchableOpacity onPress={() => setModal(aba === 'pontuacao' ? 'pont' : 'doc')}><Ionicons name="add" size={26} color="#fff" /></TouchableOpacity>
      </View>
      <View style={styles.abas}>
        {(['pontuacao', 'documentos'] as const).map((a) => (
          <TouchableOpacity key={a} style={[styles.aba, aba === a && styles.abaAtiva]} onPress={() => setAba(a)}>
            <Text style={[styles.abaTexto, aba === a && styles.abaTextoAtivo]}>{a === 'pontuacao' ? 'Pontuação' : 'Documentos'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={aba === 'pontuacao' ? itens : docs}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemNome}>{item.titulo ?? item.nome}</Text>
            {item.sigla && <Text style={styles.itemSub}>{item.sigla} — {item.valor}pts</Text>}
            {item.obrigatorio !== undefined && <Text style={styles.itemSub}>{item.obrigatorio ? 'Obrigatório' : 'Opcional'}</Text>}
          </View>
        )}
      />
      {/* Modal Pontuação */}
      <Modal visible={modal === 'pont'} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitulo}>Novo Item de Pontuação</Text>
          <TextInput style={styles.input} placeholder="Título" value={formPont.titulo} onChangeText={(v) => setFormPont((f) => ({ ...f, titulo: v }))} placeholderTextColor="#9ca3af" />
          <TextInput style={styles.input} placeholder="Sigla (ex: PR)" value={formPont.sigla} onChangeText={(v) => setFormPont((f) => ({ ...f, sigla: v }))} placeholderTextColor="#9ca3af" />
          <TextInput style={styles.input} placeholder="Valor em pontos" value={formPont.valor} onChangeText={(v) => setFormPont((f) => ({ ...f, valor: v }))} keyboardType="numeric" placeholderTextColor="#9ca3af" />
          <TouchableOpacity style={styles.botao} onPress={salvarPont}><Text style={styles.botaoTexto}>Salvar</Text></TouchableOpacity>
          <TouchableOpacity style={styles.cancelar} onPress={() => setModal(null)}><Text style={styles.cancelarTexto}>Cancelar</Text></TouchableOpacity>
        </View>
      </Modal>
      {/* Modal Documento */}
      <Modal visible={modal === 'doc'} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitulo}>Novo Documento</Text>
          <TextInput style={styles.input} placeholder="Nome do documento" value={formDoc.nome} onChangeText={(v) => setFormDoc((f) => ({ ...f, nome: v }))} placeholderTextColor="#9ca3af" />
          <TextInput style={styles.input} placeholder="Limite de anexos" value={formDoc.limite_anexos} onChangeText={(v) => setFormDoc((f) => ({ ...f, limite_anexos: v }))} keyboardType="numeric" placeholderTextColor="#9ca3af" />
          <View style={styles.switchRow}><Text style={styles.switchLabel}>Obrigatório</Text><Switch value={formDoc.obrigatorio} onValueChange={(v) => setFormDoc((f) => ({ ...f, obrigatorio: v }))} /></View>
          <View style={styles.switchRow}><Text style={styles.switchLabel}>Permite anexo</Text><Switch value={formDoc.permite_anexo} onValueChange={(v) => setFormDoc((f) => ({ ...f, permite_anexo: v }))} /></View>
          <TouchableOpacity style={styles.botao} onPress={salvarDoc}><Text style={styles.botaoTexto}>Salvar</Text></TouchableOpacity>
          <TouchableOpacity style={styles.cancelar} onPress={() => setModal(null)}><Text style={styles.cancelarTexto}>Cancelar</Text></TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 18, fontWeight: '700', color: '#fff' },
  abas: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  aba: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  abaAtiva: { borderBottomWidth: 2, borderBottomColor: '#1a56db' },
  abaTexto: { fontSize: 13, color: '#6b7280' },
  abaTextoAtivo: { color: '#1a56db', fontWeight: '700' },
  lista: { padding: 12, gap: 6 },
  item: { backgroundColor: '#fff', borderRadius: 10, padding: 14 },
  itemNome: { fontSize: 15, fontWeight: '600', color: '#111827' },
  itemSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  modal: { flex: 1, padding: 20, backgroundColor: '#fff' },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 10, color: '#111827', backgroundColor: '#f9fafb' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  switchLabel: { fontSize: 15, color: '#374151' },
  botao: { backgroundColor: '#1a56db', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelar: { alignItems: 'center', padding: 12 },
  cancelarTexto: { color: '#6b7280', fontSize: 15 },
});
