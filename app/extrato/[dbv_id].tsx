import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useFocusEffect } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Extrato() {
  const { dbv_id } = useLocalSearchParams<{ dbv_id: string }>();
  const router = useRouter();
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [membro, setMembro] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [total, setTotal] = useState(0);

  useFocusEffect(React.useCallback(() => { carregar(); }, [dbv_id]));

  async function carregar() {
    setCarregando(true);
    const [{ data: m }, { data: p }] = await Promise.all([
      supabase.from('desbravadores').select('nome').eq('id', dbv_id).single(),
      supabase.from('pontuacoes').select('data, observacao, itens:pontuacao_lancamentos(valor_aplicado, item:pontuacao_itens(titulo, sigla))').eq('membro_id', dbv_id).order('data', { ascending: false }),
    ]);

    setMembro(m);
    const lista = p ?? [];
    const totalPts = lista.reduce((sum: number, p: any) => sum + (p.itens ?? []).reduce((s: number, i: any) => s + i.valor_aplicado, 0), 0);
    setTotal(totalPts);
    setLancamentos(lista);
    setCarregando(false);
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.titulo}>Extrato</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.resumo}>
        <Text style={styles.resumoNome}>{membro?.nome ?? '—'}</Text>
        <Text style={styles.resumoTotal}>{total} pontos</Text>
      </View>
      {carregando ? <ActivityIndicator style={{ marginTop: 40 }} color="#1a56db" /> : (
        <FlatList
          data={lancamentos}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => {
            const subtotal = (item.itens ?? []).reduce((s: number, i: any) => s + i.valor_aplicado, 0);
            return (
              <View style={[styles.card, subtotal < 0 && styles.cardNegativo]}>
                <Text style={styles.cardData}>{format(parseISO(item.data), 'dd/MM/yyyy', { locale: ptBR })}</Text>
                <View style={styles.cardItens}>
                  {(item.itens ?? []).map((it: any, i: number) => (
                    <Text key={i} style={styles.cardItem}>{it.item?.sigla}: {it.valor_aplicado > 0 ? '+' : ''}{it.valor_aplicado}pts</Text>
                  ))}
                </View>
                <Text style={[styles.cardTotal, subtotal < 0 && styles.cardTotalNegativo]}>{subtotal > 0 ? '+' : ''}{subtotal}pts</Text>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.vazio}>Nenhum lançamento.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 18, fontWeight: '700', color: '#fff' },
  resumo: { backgroundColor: '#1a56db', paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' },
  resumoNome: { fontSize: 18, fontWeight: '700', color: '#fff' },
  resumoTotal: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 4 },
  lista: { padding: 12, gap: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: '#22c55e' },
  cardNegativo: { borderLeftColor: '#ef4444' },
  cardData: { fontSize: 12, color: '#9ca3af', marginBottom: 6 },
  cardItens: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  cardItem: { fontSize: 12, color: '#374151', backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  cardTotal: { fontSize: 16, fontWeight: '700', color: '#22c55e', textAlign: 'right' },
  cardTotalNegativo: { color: '#ef4444' },
  vazio: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});
