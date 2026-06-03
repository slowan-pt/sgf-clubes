import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { getClubeAtivoId } from '../../src/lib/contextoAtual';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Auditoria() {
  const router = useRouter();
  const [eventos, setEventos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(React.useCallback(() => { carregar(); }, []));

  async function carregar() {
    const clube_id = getClubeAtivoId();
    setCarregando(true);
    const { data } = await supabase
      .from('auditoria_eventos')
      .select('*')
      .eq('clube_id', clube_id)
      .order('created_at', { ascending: false })
      .limit(100);
    setEventos(data ?? []);
    setCarregando(false);
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Auditoria</Text>
        <View style={{ width: 24 }} />
      </View>

      {carregando ? <ActivityIndicator style={{ marginTop: 40 }} color="#1a56db" /> : (
        <FlatList
          data={eventos}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.acao}>{item.acao}</Text>
              <Text style={styles.data}>
                {format(parseISO(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.vazio}>Nenhum evento registrado.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 18, fontWeight: '700', color: '#fff' },
  lista: { padding: 12, gap: 6 },
  item: { backgroundColor: '#fff', borderRadius: 10, padding: 12 },
  acao: { fontSize: 14, fontWeight: '600', color: '#111827' },
  data: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  vazio: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});
