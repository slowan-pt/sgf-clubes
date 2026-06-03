import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useContextoStore } from '../../src/stores/contextoStore';
import type { ContextoAcesso } from '../../src/types';

const ICONES: Record<string, keyof typeof Ionicons.glyphMap> = {
  admin_ti: 'shield',
  admin_clube: 'settings',
  usuario_diretoria: 'star',
  usuario_secretaria: 'document-text',
  usuario_tesouraria: 'cash',
  usuario_conselheiro: 'people',
  usuario_pastor: 'book',
  usuario_regional: 'globe',
  usuario_capelao: 'heart',
  responsavel: 'person',
};

export default function Contexto() {
  const router = useRouter();
  const { contextos, selecionarContexto } = useContextoStore();

  function selecionar(ctx: ContextoAcesso) {
    selecionarContexto(ctx);
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Como deseja acessar?</Text>
        <Text style={styles.subtitulo}>Selecione seu contexto de acesso</Text>
      </View>

      <FlatList
        data={contextos}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => selecionar(item)}>
            <View style={styles.iconeContainer}>
              <Ionicons
                name={ICONES[item.perfil] ?? 'person-circle'}
                size={28}
                color="#1a56db"
              />
            </View>
            <View style={styles.info}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.clube}>{item.clube_nome}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: {
    backgroundColor: '#1a56db',
    padding: 20,
    paddingTop: 60,
  },
  titulo: { fontSize: 22, fontWeight: '700', color: '#fff' },
  subtitulo: { fontSize: 14, color: '#bfdbfe', marginTop: 4 },
  lista: { padding: 16, gap: 10 },
  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconeContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  info: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: '#111827' },
  clube: { fontSize: 13, color: '#6b7280', marginTop: 2 },
});
