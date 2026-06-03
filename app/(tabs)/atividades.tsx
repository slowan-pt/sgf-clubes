import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { getClubeAtivoId } from '../../src/lib/contextoAtual';
import { usePermissoes } from '../../src/lib/permissoes';
import { format, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Atividade } from '../../src/types';

export default function Atividades() {
  const router = useRouter();
  const { pode } = usePermissoes();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(React.useCallback(() => { carregar(); }, []));

  async function carregar() {
    const clube_id = getClubeAtivoId();
    if (!clube_id) return;

    setCarregando(true);
    const { data } = await supabase
      .from('atividades')
      .select('*, respostas:atividades_respostas(*)')
      .eq('clube_id', clube_id)
      .eq('ativo', true)
      .order('prazo', { ascending: true, nullsFirst: false });

    setAtividades((data as Atividade[]) ?? []);
    setCarregando(false);
  }

  const abertas = atividades.filter((a) => !a.prazo || !isPast(parseISO(a.prazo)));
  const encerradas = atividades.filter((a) => a.prazo && isPast(parseISO(a.prazo)));

  function corStatus(a: Atividade) {
    if (!a.prazo) return '#6b7280';
    const d = parseISO(a.prazo);
    if (isPast(d)) return '#ef4444';
    const diffDias = (d.getTime() - Date.now()) / 86400000;
    if (diffDias < 3) return '#f59e0b';
    return '#22c55e';
  }

  function renderItem({ item }: { item: Atividade }) {
    const pendentes = (item.respostas ?? []).filter(
      (r) => r.status === 'entregue',
    ).length;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/atividades/${item.id}` as any)}
      >
        <View style={[styles.cardBarra, { backgroundColor: corStatus(item) }]} />
        <View style={styles.cardCorpo}>
          <Text style={styles.cardTitulo}>{item.titulo}</Text>
          {item.prazo && (
            <Text style={styles.cardPrazo}>
              Prazo: {format(parseISO(item.prazo), "dd/MM/yyyy", { locale: ptBR })}
            </Text>
          )}
          {pendentes > 0 && (
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeTexto}>{pendentes} aguardando avaliação</Text>
              </View>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Atividades</Text>
      </View>

      {carregando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a56db" />
      ) : (
        <FlatList
          data={[
            ...abertas,
            ...(encerradas.length > 0
              ? [{ id: -1, titulo: '─── Encerradas ───', _separador: true } as any]
              : []),
            ...encerradas,
          ]}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) =>
            (item as any)._separador ? (
              <Text style={styles.separador}>{item.titulo}</Text>
            ) : (
              renderItem({ item })
            )
          }
          ListEmptyComponent={<Text style={styles.vazio}>Nenhuma atividade.</Text>}
        />
      )}

      {pode('gerenciar_atividades') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/atividades/nova' as any)}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
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
  lista: { padding: 12, gap: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardBarra: { width: 4, alignSelf: 'stretch' },
  cardCorpo: { flex: 1, padding: 14 },
  cardTitulo: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardPrazo: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  badgeRow: { flexDirection: 'row', marginTop: 6 },
  badge: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeTexto: { fontSize: 11, color: '#15803d', fontWeight: '600' },
  separador: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginVertical: 4,
  },
  vazio: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a56db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
});
