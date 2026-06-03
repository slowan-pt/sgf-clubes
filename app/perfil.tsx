import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/authStore';
import { useContextoStore } from '../src/stores/contextoStore';
import { Avatar } from '../src/components/common/Avatar';

export default function Perfil() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { contextos, contextoAtivo, selecionarContexto } = useContextoStore();

  async function sair() {
    await logout();
    router.replace('/auth/login');
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.info}>
        <Avatar nome={user?.email ?? ''} tamanho={72} />
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.contexto}>{contextoAtivo?.label ?? ''}</Text>
      </View>

      {contextos.length > 1 && (
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Trocar contexto</Text>
          <FlatList
            data={contextos}
            keyExtractor={(_, i) => String(i)}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const ativo = item.clube_id === contextoAtivo?.clube_id && item.perfil === contextoAtivo?.perfil;
              return (
                <TouchableOpacity
                  style={[styles.itemCtx, ativo && styles.itemCtxAtivo]}
                  onPress={() => { selecionarContexto(item); router.replace('/(tabs)'); }}
                >
                  <Text style={[styles.itemCtxTexto, ativo && styles.itemCtxTextoAtivo]}>
                    {item.label}
                  </Text>
                  {ativo && <Ionicons name="checkmark" size={18} color="#1a56db" />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      <View style={styles.rodape}>
        <TouchableOpacity style={styles.sairBtn} onPress={sair}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.sairTexto}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: {
    backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  titulo: { fontSize: 18, fontWeight: '700', color: '#fff' },
  info: { backgroundColor: '#fff', padding: 24, alignItems: 'center', gap: 8 },
  email: { fontSize: 16, fontWeight: '600', color: '#111827' },
  contexto: { fontSize: 13, color: '#6b7280' },
  secao: { margin: 16 },
  secaoTitulo: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  itemCtx: { padding: 14, borderRadius: 10, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  itemCtxAtivo: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  itemCtxTexto: { fontSize: 14, color: '#374151' },
  itemCtxTextoAtivo: { color: '#1a56db', fontWeight: '600' },
  rodape: { position: 'absolute', bottom: 40, left: 0, right: 0, padding: 20 },
  sairBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fff7f7' },
  sairTexto: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
