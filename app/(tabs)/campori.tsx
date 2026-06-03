import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCamporiStore } from '../../src/stores/camporiStore';
import { useDbvStore } from '../../src/stores/dbvStore';

export default function Campori() {
  const { config, parcelas, pagamentos, carregar, registrarPagamento } = useCamporiStore();
  const { membros, carregar: carregarMembros } = useDbvStore();

  useFocusEffect(React.useCallback(() => {
    carregar();
    carregarMembros();
  }, []));

  if (!config) {
    return (
      <View style={styles.tela}>
        <View style={styles.cabecalho}><Text style={styles.titulo}>Campori</Text></View>
        <View style={styles.centro}><Text style={styles.vazio}>Campori não configurado para este clube.</Text></View>
      </View>
    );
  }

  const ativos = membros.filter((m) => m.ativo);

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Campori</Text>
        <Text style={styles.sub}>{config.num_parcelas} parcelas</Text>
      </View>

      <FlatList
        data={ativos}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.lista}
        renderItem={({ item: membro }) => {
          const pagsMembro = pagamentos.filter((p) => p.membro_id === membro.id);
          const total = pagsMembro.reduce((s, p) => s + p.valor_pago, 0);
          const totalEsperado = parcelas.reduce((s, p) => s + p.valor, 0);

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardNome}>{membro.nome}</Text>
                <Text style={[styles.cardTotal, total >= totalEsperado && styles.cardTotalOk]}>
                  R$ {total.toFixed(2)} / R$ {totalEsperado.toFixed(2)}
                </Text>
              </View>
              <View style={styles.parcelasRow}>
                {parcelas.map((parc) => {
                  const pago = pagsMembro.some((p) => p.parcela_id === parc.id);
                  return (
                    <TouchableOpacity
                      key={parc.id}
                      style={[styles.parcela, pago && styles.parcelaPaga]}
                      onPress={() => !pago && registrarPagamento(membro.id, parc.id, parc.valor)}
                    >
                      <Text style={[styles.parcelaTexto, pago && styles.parcelaTextoPago]}>
                        {parc.numero}ª{'\n'}R${parc.valor}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  titulo: { fontSize: 22, fontWeight: '700', color: '#fff' },
  sub: { fontSize: 13, color: '#bfdbfe' },
  lista: { padding: 12, gap: 10 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardNome: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardTotal: { fontSize: 14, color: '#6b7280' },
  cardTotalOk: { color: '#22c55e', fontWeight: '700' },
  parcelasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  parcela: { width: 56, height: 52, borderRadius: 8, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db' },
  parcelaPaga: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  parcelaTexto: { fontSize: 10, textAlign: 'center', color: '#374151' },
  parcelaTextoPago: { color: '#fff', fontWeight: '700' },
  vazio: { fontSize: 15, color: '#9ca3af', textAlign: 'center' },
});
