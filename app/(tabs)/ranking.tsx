import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { getClubeAtivoId } from '../../src/lib/contextoAtual';
import { Avatar } from '../../src/components/common/Avatar';

interface RankingItem {
  membro_id: number;
  nome: string;
  foto_url?: string;
  unidade_nome?: string;
  total: number;
  posicao: number;
}

export default function Ranking() {
  const [dados, setDados] = useState<RankingItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<'membros' | 'unidades'>('membros');

  useFocusEffect(React.useCallback(() => { carregar(); }, [aba]));

  async function carregar() {
    const clube_id = getClubeAtivoId();
    if (!clube_id) return;

    setCarregando(true);

    const { data } = await supabase
      .from('pontuacao_lancamentos')
      .select(`
        valor_aplicado,
        pontuacao:pontuacoes!inner(membro_id, clube_id,
          membro:desbravadores!inner(id, nome, foto_url, ativo,
            unidade:unidades(nome)))
      `)
      .eq('pontuacoes.clube_id', clube_id);

    const totais: Record<number, RankingItem> = {};

    for (const row of data ?? []) {
      const pont = (row as any).pontuacao;
      if (!pont?.membro?.ativo) continue;
      const id = pont.membro_id;
      if (!totais[id]) {
        totais[id] = {
          membro_id: id,
          nome: pont.membro.nome,
          foto_url: pont.membro.foto_url,
          unidade_nome: pont.membro.unidade?.nome,
          total: 0,
          posicao: 0,
        };
      }
      totais[id].total += row.valor_aplicado;
    }

    const lista = Object.values(totais)
      .sort((a, b) => b.total - a.total)
      .map((item, i) => ({ ...item, posicao: i + 1 }));

    setDados(lista);
    setCarregando(false);
  }

  const MEDALHAS = ['🥇', '🥈', '🥉'];

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Ranking</Text>
        <View style={styles.abas}>
          {(['membros', 'unidades'] as const).map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.aba, aba === a && styles.abaAtiva]}
              onPress={() => setAba(a)}
            >
              <Text style={[styles.abaTexto, aba === a && styles.abaTextoAtivo]}>
                {a === 'membros' ? 'Por Membro' : 'Por Unidade'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {carregando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a56db" />
      ) : (
        <FlatList
          data={dados}
          keyExtractor={(i) => String(i.membro_id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={[styles.item, item.posicao <= 3 && styles.itemDestaque]}>
              <Text style={styles.posicao}>
                {item.posicao <= 3 ? MEDALHAS[item.posicao - 1] : `${item.posicao}°`}
              </Text>
              <Avatar nome={item.nome} url={item.foto_url} tamanho={40} />
              <View style={styles.info}>
                <Text style={styles.nome}>{item.nome}</Text>
                <Text style={styles.unidade}>{item.unidade_nome ?? '—'}</Text>
              </View>
              <Text style={styles.pontos}>{item.total} pts</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.vazio}>Sem pontuações registradas.</Text>}
        />
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
  titulo: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 },
  abas: { flexDirection: 'row', gap: 8 },
  aba: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  abaAtiva: { backgroundColor: '#fff' },
  abaTexto: { fontSize: 13, color: '#bfdbfe' },
  abaTextoAtivo: { color: '#1a56db', fontWeight: '700' },
  lista: { padding: 12, gap: 8 },
  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemDestaque: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  posicao: { width: 32, fontSize: 18, textAlign: 'center' },
  info: { flex: 1 },
  nome: { fontSize: 15, fontWeight: '600', color: '#111827' },
  unidade: { fontSize: 12, color: '#6b7280' },
  pontos: { fontSize: 15, fontWeight: '700', color: '#1a56db' },
  vazio: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});
