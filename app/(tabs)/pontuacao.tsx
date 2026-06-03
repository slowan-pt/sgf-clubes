import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDbvStore } from '../../src/stores/dbvStore';
import { usePontuacaoStore } from '../../src/stores/pontuacaoStore';
import type { Membro } from '../../src/types';

export default function Pontuacao() {
  const { membros, carregar: carregarMembros } = useDbvStore();
  const { itens, lancar, carregarItens } = usePontuacaoStore();
  const [selecionados, setSelecionados] = useState<Record<number, number[]>>({});
  const [salvando, setSalvando] = useState(false);
  const data = format(new Date(), 'yyyy-MM-dd');

  useFocusEffect(React.useCallback(() => {
    carregarMembros();
    carregarItens();
  }, []));

  const ativos = membros.filter((m) => m.ativo);

  function toggleItem(membroId: number, itemId: number) {
    setSelecionados((prev) => {
      const atual = prev[membroId] ?? [];
      const novo = atual.includes(itemId)
        ? atual.filter((i) => i !== itemId)
        : [...atual, itemId];
      return { ...prev, [membroId]: novo };
    });
  }

  async function salvar() {
    setSalvando(true);
    for (const [membroIdStr, itensMarcados] of Object.entries(selecionados)) {
      if (itensMarcados.length === 0) continue;
      await lancar(Number(membroIdStr), data, itensMarcados);
    }
    setSalvando(false);
    setSelecionados({});
    alert('Pontuação lançada com sucesso!');
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Lançar Pontuação</Text>
        <Text style={styles.data}>{format(new Date(), "EEEE, dd/MM/yyyy", { locale: ptBR })}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itensRow}>
        {itens.map((item) => (
          <View key={item.id} style={styles.itemBadge}>
            <Text style={styles.itemSigla}>{item.sigla}</Text>
            <Text style={styles.itemValor}>{item.valor}pts</Text>
          </View>
        ))}
      </ScrollView>

      <FlatList
        data={ativos}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <MembroRow
            membro={item}
            itens={itens}
            selecionados={selecionados[item.id] ?? []}
            onToggle={(itemId) => toggleItem(item.id, itemId)}
          />
        )}
      />

      <View style={styles.rodape}>
        <TouchableOpacity
          style={[styles.botao, salvando && styles.botaoDesabilitado]}
          onPress={salvar}
          disabled={salvando}
        >
          {salvando
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.botaoTexto}>Salvar Pontuação</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MembroRow({ membro, itens, selecionados, onToggle }: any) {
  const total = itens
    .filter((i: any) => selecionados.includes(i.id))
    .reduce((sum: number, i: any) => sum + i.valor, 0);

  return (
    <View style={styles.membroRow}>
      <View style={styles.membroInfo}>
        <Text style={styles.membroNome}>{membro.nome}</Text>
        <Text style={styles.membroTotal}>{total} pts</Text>
      </View>
      <View style={styles.checkboxRow}>
        {itens.map((item: any) => {
          const marcado = selecionados.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.checkbox, marcado && styles.checkboxMarcado]}
              onPress={() => onToggle(item.id)}
            >
              <Text style={[styles.checkboxTexto, marcado && styles.checkboxTextoMarcado]}>
                {item.sigla}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: {
    backgroundColor: '#1a56db',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  titulo: { fontSize: 22, fontWeight: '700', color: '#fff' },
  data: { fontSize: 13, color: '#bfdbfe', marginTop: 2 },
  itensRow: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    maxHeight: 56,
  },
  itemBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    alignItems: 'center',
  },
  itemSigla: { fontSize: 12, fontWeight: '700', color: '#1a56db' },
  itemValor: { fontSize: 10, color: '#3b82f6' },
  lista: { padding: 12, gap: 6 },
  membroRow: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  membroInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  membroNome: { fontSize: 14, fontWeight: '600', color: '#111827' },
  membroTotal: { fontSize: 14, fontWeight: '700', color: '#1a56db' },
  checkboxRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  checkbox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  checkboxMarcado: { backgroundColor: '#1a56db', borderColor: '#1a56db' },
  checkboxTexto: { fontSize: 12, color: '#374151' },
  checkboxTextoMarcado: { color: '#fff', fontWeight: '700' },
  rodape: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  botao: {
    backgroundColor: '#1a56db',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  botaoDesabilitado: { opacity: 0.6 },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
