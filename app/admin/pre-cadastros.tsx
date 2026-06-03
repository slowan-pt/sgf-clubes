import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { getClubeAtivoId } from '../../src/lib/contextoAtual';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PreCadastros() {
  const router = useRouter();
  const [lista, setLista] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(React.useCallback(() => { carregar(); }, []));

  async function carregar() {
    const clube_id = getClubeAtivoId();
    setCarregando(true);
    const { data } = await supabase
      .from('pre_cadastros')
      .select('*')
      .eq('clube_id', clube_id)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });
    setLista(data ?? []);
    setCarregando(false);
  }

  async function aprovar(item: any) {
    await supabase.from('pre_cadastros').update({ status: 'aprovado' }).eq('id', item.id);
    await supabase.from('desbravadores').insert({
      clube_id: item.clube_id,
      nome: item.nome,
      email: item.email,
      telefone: item.telefone,
      data_nascimento: item.data_nascimento,
      ativo: true,
    });
    Alert.alert('Aprovado!', `${item.nome} foi adicionado como membro.`);
    carregar();
  }

  async function recusar(id: number) {
    await supabase.from('pre_cadastros').update({ status: 'recusado' }).eq('id', id);
    carregar();
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Pré-cadastros</Text>
        <View style={{ width: 24 }} />
      </View>

      {carregando ? <ActivityIndicator style={{ marginTop: 40 }} color="#1a56db" /> : (
        <FlatList
          data={lista}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.nome}>{item.nome}</Text>
              {item.data_nascimento && (
                <Text style={styles.info}>
                  Nascimento: {format(parseISO(item.data_nascimento), 'dd/MM/yyyy', { locale: ptBR })}
                </Text>
              )}
              {item.email && <Text style={styles.info}>E-mail: {item.email}</Text>}
              <Text style={styles.data}>
                Enviado em: {format(parseISO(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </Text>
              <View style={styles.acoes}>
                <TouchableOpacity style={styles.btnAprovar} onPress={() => aprovar(item)}>
                  <Text style={styles.btnTexto}>✓ Aprovar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnRecusar} onPress={() => recusar(item.id)}>
                  <Text style={styles.btnTextoRecusar}>✕ Recusar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.vazio}>Nenhum pré-cadastro pendente.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 18, fontWeight: '700', color: '#fff' },
  lista: { padding: 12, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  nome: { fontSize: 16, fontWeight: '700', color: '#111827' },
  info: { fontSize: 13, color: '#374151' },
  data: { fontSize: 11, color: '#9ca3af' },
  acoes: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btnAprovar: { flex: 1, backgroundColor: '#dcfce7', borderRadius: 8, padding: 10, alignItems: 'center' },
  btnRecusar: { flex: 1, backgroundColor: '#fee2e2', borderRadius: 8, padding: 10, alignItems: 'center' },
  btnTexto: { color: '#15803d', fontWeight: '700', fontSize: 14 },
  btnTextoRecusar: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
  vazio: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});
