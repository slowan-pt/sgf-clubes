import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { getClubeAtivoId } from '../../src/lib/contextoAtual';
import { useAuthStore } from '../../src/stores/authStore';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MensagemClube } from '../../src/types';

export default function Mensagens() {
  const session = useAuthStore((s) => s.session);
  const [mensagens, setMensagens] = useState<MensagemClube[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [expandido, setExpandido] = useState<number | null>(null);

  useFocusEffect(React.useCallback(() => { carregar(); }, []));

  async function carregar() {
    const clube_id = getClubeAtivoId();
    if (!clube_id || !session) return;
    setCarregando(true);

    const { data } = await supabase
      .from('mensagens_clube')
      .select('*')
      .eq('clube_id', clube_id)
      .order('created_at', { ascending: false });

    const { data: lidos } = await supabase
      .from('mensagens_clube_lidos')
      .select('mensagem_id')
      .eq('usuario_id', session.user.id);

    const { data: ocultos } = await supabase
      .from('mensagens_clube_ocultos')
      .select('mensagem_id')
      .eq('usuario_id', session.user.id);

    const idLidos = new Set((lidos ?? []).map((l: any) => l.mensagem_id));
    const idOcultos = new Set((ocultos ?? []).map((o: any) => o.mensagem_id));

    const lista = (data ?? [])
      .filter((m: any) => !idOcultos.has(m.id))
      .map((m: any) => ({ ...m, lido: idLidos.has(m.id) }));

    setMensagens(lista as MensagemClube[]);
    setCarregando(false);
  }

  async function marcarLido(id: number) {
    if (!session) return;
    await supabase.from('mensagens_clube_lidos').upsert({
      mensagem_id: id,
      usuario_id: session.user.id,
    });
    setMensagens((ms) => ms.map((m) => (m.id === id ? { ...m, lido: true } : m)));
  }

  async function ocultar(id: number) {
    if (!session) return;
    await supabase.from('mensagens_clube_ocultos').upsert({
      mensagem_id: id,
      usuario_id: session.user.id,
    });
    setMensagens((ms) => ms.filter((m) => m.id !== id));
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Avisos</Text>
      </View>

      {carregando ? <ActivityIndicator style={{ marginTop: 40 }} color="#1a56db" /> : (
        <FlatList
          data={mensagens}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => {
            const aberto = expandido === item.id;
            return (
              <TouchableOpacity
                style={[styles.card, !item.lido && styles.cardNaoLido]}
                onPress={() => {
                  setExpandido(aberto ? null : item.id);
                  if (!item.lido) marcarLido(item.id);
                }}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitulo}>{item.titulo}</Text>
                  <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={18} color="#9ca3af" />
                </View>
                <Text style={styles.cardData}>
                  {format(parseISO(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </Text>
                {aberto && (
                  <View style={styles.corpo}>
                    <Text style={styles.corpoTexto}>{item.corpo}</Text>
                    <TouchableOpacity style={styles.ocultarBtn} onPress={() => ocultar(item.id)}>
                      <Text style={styles.ocultarTexto}>Ocultar aviso</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={styles.vazio}>Nenhum aviso.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  titulo: { fontSize: 22, fontWeight: '700', color: '#fff' },
  lista: { padding: 12, gap: 8 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardNaoLido: { borderLeftWidth: 4, borderLeftColor: '#1a56db' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitulo: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  cardData: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  corpo: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  corpoTexto: { fontSize: 14, color: '#374151', lineHeight: 20 },
  ocultarBtn: { marginTop: 10 },
  ocultarTexto: { fontSize: 12, color: '#9ca3af' },
  vazio: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});
