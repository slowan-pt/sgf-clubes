import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Modal, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useDbvStore } from '../../src/stores/dbvStore';
import { usePontuacaoStore } from '../../src/stores/pontuacaoStore';
import { format } from 'date-fns';
import { Avatar } from '../../src/components/common/Avatar';

export default function Extras() {
  const { membros, carregar: carregarMembros } = useDbvStore();
  const { itens, descontar, carregarItens } = usePontuacaoStore();
  const [modal, setModal] = useState(false);
  const [membrosSelecionados, setMembrosSelecionados] = useState<number[]>([]);
  const [itemSelecionado, setItemSelecionado] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);

  useFocusEffect(React.useCallback(() => {
    carregarMembros();
    carregarItens();
  }, []));

  const ativos = membros.filter((m) => m.ativo);

  function toggleMembro(id: number) {
    setMembrosSelecionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  async function aplicarDesconto() {
    if (!itemSelecionado || membrosSelecionados.length === 0) {
      Alert.alert('Selecione item e pelo menos um membro.');
      return;
    }
    setSalvando(true);
    await descontar(membrosSelecionados, itemSelecionado, format(new Date(), 'yyyy-MM-dd'));
    setSalvando(false);
    setModal(false);
    setMembrosSelecionados([]);
    setItemSelecionado(null);
    Alert.alert('Desconto aplicado!');
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Pontos Extras / Descontos</Text>
      </View>

      <View style={styles.corpo}>
        <Text style={styles.desc}>
          Aplique pontos extras ou descontos a membros específicos do clube.
        </Text>
        <TouchableOpacity style={styles.botao} onPress={() => setModal(true)}>
          <Text style={styles.botaoTexto}>Aplicar Desconto</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitulo}>Descontar Pontos</Text>

          <Text style={styles.secao}>Selecione o item:</Text>
          <View style={styles.itensRow}>
            {itens.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.chip, itemSelecionado === item.id && styles.chipAtivo]}
                onPress={() => setItemSelecionado(item.id)}
              >
                <Text style={[styles.chipTexto, itemSelecionado === item.id && styles.chipTextoAtivo]}>
                  {item.sigla} (-{item.valor}pts)
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.secao}>Selecione os membros:</Text>
          <FlatList
            data={ativos}
            keyExtractor={(m) => String(m.id)}
            style={{ maxHeight: 300 }}
            renderItem={({ item }) => {
              const sel = membrosSelecionados.includes(item.id);
              return (
                <TouchableOpacity
                  style={[styles.membroItem, sel && styles.membroItemSel]}
                  onPress={() => toggleMembro(item.id)}
                >
                  <Avatar nome={item.nome} tamanho={32} />
                  <Text style={styles.membroNome}>{item.nome}</Text>
                  {sel && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity
            style={[styles.botao, salvando && { opacity: 0.6 }]}
            onPress={aplicarDesconto}
            disabled={salvando}
          >
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Aplicar</Text>}
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
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  titulo: { fontSize: 22, fontWeight: '700', color: '#fff' },
  corpo: { flex: 1, padding: 20, gap: 16 },
  desc: { fontSize: 15, color: '#374151', lineHeight: 22 },
  botao: { backgroundColor: '#1a56db', borderRadius: 10, padding: 14, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modal: { flex: 1, padding: 20, backgroundColor: '#fff' },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  secao: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  itensRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' },
  chipAtivo: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  chipTexto: { fontSize: 13, color: '#374151' },
  chipTextoAtivo: { color: '#fff', fontWeight: '700' },
  membroItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, marginBottom: 4 },
  membroItemSel: { backgroundColor: '#eff6ff' },
  membroNome: { flex: 1, fontSize: 14, color: '#111827' },
  check: { fontSize: 16, color: '#1a56db', fontWeight: '700' },
  cancelar: { marginTop: 10, alignItems: 'center', padding: 12 },
  cancelarTexto: { color: '#6b7280', fontSize: 15 },
});
