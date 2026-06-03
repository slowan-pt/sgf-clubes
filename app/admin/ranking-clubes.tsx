import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';

export default function RankingClubes() {
  const router = useRouter();
  const [dados, setDados] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(React.useCallback(() => { carregar(); }, []));

  async function carregar() {
    setCarregando(true);
    const { data: clubes } = await supabase.from('clubes').select('id, nome, cor_primaria').eq('ativo', true);
    const resultados = [];

    for (const clube of clubes ?? []) {
      const { data } = await supabase
        .from('pontuacao_lancamentos')
        .select('valor_aplicado, pontuacao:pontuacoes!inner(clube_id)')
        .eq('pontuacoes.clube_id', clube.id);

      const total = (data ?? []).reduce((s: number, r: any) => s + r.valor_aplicado, 0);
      resultados.push({ ...clube, total });
    }

    resultados.sort((a, b) => b.total - a.total);
    setDados(resultados.map((r, i) => ({ ...r, posicao: i + 1 })));
    setCarregando(false);
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.titulo}>Ranking de Clubes</Text>
        <View style={{ width: 24 }} />
      </View>
      {carregando ? <ActivityIndicator style={{ marginTop: 40 }} color="#1a56db" /> : (
        <FlatList
          data={dados}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={[styles.card, { borderLeftColor: item.cor_primaria, borderLeftWidth: 5 }]}>
              <Text style={styles.posicao}>{item.posicao}°</Text>
              <Text style={styles.nome}>{item.nome}</Text>
              <Text style={styles.total}>{item.total} pts</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 18, fontWeight: '700', color: '#fff' },
  lista: { padding: 12, gap: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  posicao: { fontSize: 18, fontWeight: '800', color: '#374151', width: 32 },
  nome: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  total: { fontSize: 15, fontWeight: '700', color: '#1a56db' },
});
