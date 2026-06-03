import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useDbvStore } from '../../src/stores/dbvStore';
import { usePermissoes } from '../../src/lib/permissoes';
import { Avatar } from '../../src/components/common/Avatar';
import type { Membro } from '../../src/types';

export default function Membros() {
  const router = useRouter();
  const { membros, carregando, carregar } = useDbvStore();
  const { pode } = usePermissoes();
  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState(true);

  useFocusEffect(React.useCallback(() => { carregar(); }, []));

  const filtrados = membros.filter((m) => {
    const buscaOk = m.nome.toLowerCase().includes(busca.toLowerCase());
    const ativoOk = m.ativo === filtroAtivo;
    return buscaOk && ativoOk;
  });

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Membros</Text>
        <Text style={styles.total}>{filtrados.length} encontrados</Text>
      </View>

      <View style={styles.filtros}>
        <View style={styles.busca}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar por nome..."
            value={busca}
            onChangeText={setBusca}
            placeholderTextColor="#9ca3af"
          />
          {busca ? (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.toggleRow}>
          {[true, false].map((v) => (
            <TouchableOpacity
              key={String(v)}
              style={[styles.toggle, filtroAtivo === v && styles.toggleAtivo]}
              onPress={() => setFiltroAtivo(v)}
            >
              <Text style={[styles.toggleTexto, filtroAtivo === v && styles.toggleTextoAtivo]}>
                {v ? 'Ativos' : 'Inativos'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {carregando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a56db" />
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => <ItemMembro item={item} onPress={() => router.push(`/membro/${item.id}` as any)} />}
          ListEmptyComponent={<Text style={styles.vazio}>Nenhum membro encontrado.</Text>}
        />
      )}

      {pode('gerenciar_membros') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/membro/novo' as any)}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function ItemMembro({ item, onPress }: { item: Membro; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Avatar nome={item.nome} url={item.foto_url} tamanho={44} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemNome}>{item.nome}</Text>
        <Text style={styles.itemSub}>
          {(item as any).unidade?.nome ?? 'Sem unidade'} •{' '}
          {(item as any).cargo?.nome_masculino ?? 'Sem cargo'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
    </TouchableOpacity>
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
  total: { fontSize: 13, color: '#bfdbfe', marginTop: 2 },
  filtros: { padding: 12, gap: 8 },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  buscaInput: { flex: 1, fontSize: 15, paddingVertical: 10, color: '#111827' },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggle: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  toggleAtivo: { backgroundColor: '#1a56db' },
  toggleTexto: { fontSize: 13, color: '#374151' },
  toggleTextoAtivo: { color: '#fff', fontWeight: '600' },
  lista: { padding: 12, gap: 8 },
  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  itemInfo: { flex: 1 },
  itemNome: { fontSize: 15, fontWeight: '600', color: '#111827' },
  itemSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
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
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});
