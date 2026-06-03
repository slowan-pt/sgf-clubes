import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { getClubeAtivoId } from '../../src/lib/contextoAtual';
import { useDbvStore } from '../../src/stores/dbvStore';
import { useFocusEffect } from 'expo-router';

export default function Relatorios() {
  const router = useRouter();
  const { membros, carregar } = useDbvStore();
  const [carregando, setCarregando] = useState(false);
  const [resumo, setResumo] = useState<any>(null);

  useFocusEffect(React.useCallback(() => { carregar(); carregarResumo(); }, []));

  async function carregarResumo() {
    const clube_id = getClubeAtivoId();
    setCarregando(true);

    const [{ count: totalMembros }, { count: totalAtivos }, { count: totalDocs }] = await Promise.all([
      supabase.from('desbravadores').select('*', { count: 'exact', head: true }).eq('clube_id', clube_id),
      supabase.from('desbravadores').select('*', { count: 'exact', head: true }).eq('clube_id', clube_id).eq('ativo', true),
      supabase.from('documentos').select('*', { count: 'exact', head: true }).eq('clube_id', clube_id).eq('status', 'OK'),
    ]);

    setResumo({ totalMembros, totalAtivos, totalDocs });
    setCarregando(false);
  }

  function imprimirPDF() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.titulo}>Relatórios</Text>
        <TouchableOpacity onPress={imprimirPDF}><Ionicons name="print" size={24} color="#fff" /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.corpo}>
        {carregando ? <ActivityIndicator color="#1a56db" /> : (
          <>
            <Text style={styles.secao}>Resumo do Clube</Text>
            <View style={styles.cardRow}>
              <View style={styles.card}><Text style={styles.cardNum}>{resumo?.totalMembros ?? 0}</Text><Text style={styles.cardLabel}>Total de membros</Text></View>
              <View style={styles.card}><Text style={styles.cardNum}>{resumo?.totalAtivos ?? 0}</Text><Text style={styles.cardLabel}>Membros ativos</Text></View>
              <View style={styles.card}><Text style={styles.cardNum}>{resumo?.totalDocs ?? 0}</Text><Text style={styles.cardLabel}>Documentos OK</Text></View>
            </View>

            <Text style={styles.secao}>Membros Ativos</Text>
            {membros.filter((m) => m.ativo).map((m) => (
              <View key={m.id} style={styles.membroItem}>
                <Text style={styles.membroNome}>{m.nome}</Text>
                <Text style={styles.membroSub}>{(m as any)?.unidade?.nome ?? '—'}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 18, fontWeight: '700', color: '#fff' },
  corpo: { padding: 16, gap: 12 },
  secao: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8 },
  cardRow: { flexDirection: 'row', gap: 10 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  cardNum: { fontSize: 28, fontWeight: '800', color: '#1a56db' },
  cardLabel: { fontSize: 11, color: '#6b7280', textAlign: 'center', marginTop: 4 },
  membroItem: { backgroundColor: '#fff', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between' },
  membroNome: { fontSize: 14, color: '#111827' },
  membroSub: { fontSize: 13, color: '#6b7280' },
});
