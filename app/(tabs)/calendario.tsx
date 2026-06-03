import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { getClubeAtivoId } from '../../src/lib/contextoAtual';
import { usePermissoes } from '../../src/lib/permissoes';
import { format, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Evento } from '../../src/types';

export default function Calendario() {
  const { pode } = usePermissoes();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ titulo: '', data_inicio: '', horario: '', local: '', descricao: '' });

  useFocusEffect(React.useCallback(() => { carregar(); }, []));

  async function carregar() {
    const clube_id = getClubeAtivoId();
    if (!clube_id) return;
    setCarregando(true);
    const { data } = await supabase
      .from('eventos')
      .select('*')
      .eq('clube_id', clube_id)
      .order('data_inicio');
    setEventos((data as Evento[]) ?? []);
    setCarregando(false);
  }

  async function salvarEvento() {
    const clube_id = getClubeAtivoId();
    if (!form.titulo || !form.data_inicio) {
      Alert.alert('Preencha título e data.');
      return;
    }
    await supabase.from('eventos').insert({ ...form, clube_id });
    setModal(false);
    setForm({ titulo: '', data_inicio: '', horario: '', local: '', descricao: '' });
    carregar();
  }

  const futuros = eventos.filter((e) => !isAfter(new Date(), parseISO(e.data_inicio)));
  const passados = eventos.filter((e) => isAfter(new Date(), parseISO(e.data_inicio)));

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Agenda</Text>
      </View>

      {carregando ? <ActivityIndicator style={{ marginTop: 40 }} color="#1a56db" /> : (
        <FlatList
          data={[...futuros, ...passados]}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.dataBadge}>
                <Text style={styles.dataDia}>
                  {format(parseISO(item.data_inicio), 'dd', { locale: ptBR })}
                </Text>
                <Text style={styles.dataMes}>
                  {format(parseISO(item.data_inicio), 'MMM', { locale: ptBR }).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitulo}>{item.titulo}</Text>
                {item.horario && <Text style={styles.cardSub}>🕐 {item.horario}</Text>}
                {item.local && <Text style={styles.cardSub}>📍 {item.local}</Text>}
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.vazio}>Nenhum evento agendado.</Text>}
        />
      )}

      {pode('gerenciar_agenda') && (
        <TouchableOpacity style={styles.fab} onPress={() => setModal(true)}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalCabecalho}>
            <Text style={styles.modalTitulo}>Novo Evento</Text>
            <TouchableOpacity onPress={() => setModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          {(['titulo', 'data_inicio', 'horario', 'local', 'descricao'] as const).map((campo) => (
            <TextInput
              key={campo}
              style={styles.input}
              placeholder={campo === 'data_inicio' ? 'Data (YYYY-MM-DD)' : campo.charAt(0).toUpperCase() + campo.slice(1)}
              value={form[campo]}
              onChangeText={(v) => setForm((f) => ({ ...f, [campo]: v }))}
              placeholderTextColor="#9ca3af"
            />
          ))}
          <TouchableOpacity style={styles.botao} onPress={salvarEvento}>
            <Text style={styles.botaoTexto}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  titulo: { fontSize: 22, fontWeight: '700', color: '#fff' },
  lista: { padding: 12, gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row',
    alignItems: 'center', padding: 14, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  dataBadge: {
    backgroundColor: '#eff6ff', borderRadius: 10, width: 48, height: 52,
    justifyContent: 'center', alignItems: 'center',
  },
  dataDia: { fontSize: 20, fontWeight: '800', color: '#1a56db' },
  dataMes: { fontSize: 11, color: '#3b82f6', fontWeight: '600' },
  cardInfo: { flex: 1 },
  cardTitulo: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  vazio: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  fab: {
    position: 'absolute', bottom: 90, right: 20,
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#1a56db',
    justifyContent: 'center', alignItems: 'center', elevation: 6,
  },
  modal: { flex: 1, padding: 20, backgroundColor: '#fff' },
  modalCabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: '#111827' },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12,
    fontSize: 15, marginBottom: 12, color: '#111827', backgroundColor: '#f9fafb',
  },
  botao: { backgroundColor: '#1a56db', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
