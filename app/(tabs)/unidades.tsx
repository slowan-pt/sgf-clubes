import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { getClubeAtivoId } from '../../src/lib/contextoAtual';
import type { Unidade } from '../../src/types';

const CORES = ['#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#8b5cf6','#ec4899'];

export default function Unidades() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: '', cor: CORES[0] });

  useFocusEffect(React.useCallback(() => { carregar(); }, []));

  async function carregar() {
    const clube_id = getClubeAtivoId();
    if (!clube_id) return;
    setCarregando(true);
    const { data } = await supabase
      .from('unidades')
      .select('*')
      .eq('clube_id', clube_id)
      .eq('ativo', true)
      .order('nome');
    setUnidades((data as Unidade[]) ?? []);
    setCarregando(false);
  }

  async function salvar() {
    if (!form.nome) { Alert.alert('Informe o nome da unidade.'); return; }
    const clube_id = getClubeAtivoId();
    await supabase.from('unidades').insert({ ...form, clube_id, ativo: true });
    setModal(false);
    setForm({ nome: '', cor: CORES[0] });
    carregar();
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Unidades</Text>
        <TouchableOpacity onPress={() => setModal(true)}>
          <Ionicons name="add-circle" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {carregando ? <ActivityIndicator style={{ marginTop: 40 }} color="#1a56db" /> : (
        <FlatList
          data={unidades}
          keyExtractor={(u) => String(u.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={[styles.card, { borderLeftColor: item.cor, borderLeftWidth: 5 }]}>
              <Text style={styles.nome}>{item.nome}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.vazio}>Nenhuma unidade cadastrada.</Text>}
        />
      )}

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitulo}>Nova Unidade</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome da unidade"
            value={form.nome}
            onChangeText={(v) => setForm((f) => ({ ...f, nome: v }))}
            placeholderTextColor="#9ca3af"
          />
          <Text style={styles.secao}>Cor:</Text>
          <View style={styles.coresRow}>
            {CORES.map((cor) => (
              <TouchableOpacity
                key={cor}
                style={[styles.corChip, { backgroundColor: cor }, form.cor === cor && styles.corChipSel]}
                onPress={() => setForm((f) => ({ ...f, cor }))}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.botao} onPress={salvar}>
            <Text style={styles.botaoTexto}>Salvar</Text>
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
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontSize: 22, fontWeight: '700', color: '#fff' },
  lista: { padding: 12, gap: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  nome: { fontSize: 16, fontWeight: '600', color: '#111827' },
  vazio: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  modal: { flex: 1, padding: 20, backgroundColor: '#fff' },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12, color: '#111827', backgroundColor: '#f9fafb' },
  secao: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  coresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  corChip: { width: 36, height: 36, borderRadius: 18 },
  corChipSel: { borderWidth: 3, borderColor: '#111827' },
  botao: { backgroundColor: '#1a56db', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelar: { alignItems: 'center', padding: 12 },
  cancelarTexto: { color: '#6b7280', fontSize: 15 },
});
