import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { registrarAceite } from '../../src/lib/lgpd';
import { useAuthStore } from '../../src/stores/authStore';

export default function Consent() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const setLgpdAceito = useAuthStore((s) => s.setLgpdAceito);
  const [termo, setTermo] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase
      .from('lgpd_termos')
      .select('*')
      .eq('vigente', true)
      .limit(1)
      .single()
      .then(({ data }) => {
        setTermo(data);
        setCarregando(false);
      });
  }, []);

  async function aceitar() {
    if (!session || !termo) return;
    await registrarAceite(session.user.id, termo.id);
    setLgpdAceito(true);
    router.replace('/');
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color="#1a56db" />
      </View>
    );
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Termo de Consentimento</Text>
        <Text style={styles.versao}>Versão {termo?.versao ?? '1.0'}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.conteudo}>{termo?.conteudo ?? ''}</Text>
      </ScrollView>

      <View style={styles.rodape}>
        <TouchableOpacity style={styles.botao} onPress={aceitar}>
          <Text style={styles.botaoTexto}>Li e aceito os termos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#fff' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cabecalho: {
    backgroundColor: '#1a56db',
    padding: 20,
    paddingTop: 60,
  },
  titulo: { fontSize: 20, fontWeight: '700', color: '#fff' },
  versao: { fontSize: 12, color: '#bfdbfe', marginTop: 4 },
  scroll: { flex: 1 },
  conteudo: { fontSize: 14, color: '#374151', lineHeight: 22 },
  rodape: { padding: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  botao: {
    backgroundColor: '#1a56db',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
