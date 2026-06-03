import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/authStore';

export default function Convite() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const [convite, setConvite] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [aceitando, setAceitando] = useState(false);

  useEffect(() => { carregarConvite(); }, [token]);

  async function carregarConvite() {
    const { data } = await supabase.from('convites_responsavel').select('*, membro:desbravadores(nome), clube:clubes(nome)').eq('token', token).single();
    setConvite(data);
    setCarregando(false);
  }

  async function aceitar() {
    if (!session) { router.push('/auth/login'); return; }
    setAceitando(true);

    const { error } = await supabase.rpc('aceitar_convite_responsavel', {
      p_token: token,
      p_usuario_id: session.user.id,
    });

    setAceitando(false);
    if (error) { Alert.alert('Erro', error.message); return; }
    Alert.alert('Vínculo criado!', 'Você agora é responsável por este membro.');
    router.replace('/');
  }

  if (carregando) return <View style={styles.centro}><ActivityIndicator color="#1a56db" /></View>;
  if (!convite) return <View style={styles.centro}><Text style={styles.erro}>Convite inválido ou expirado.</Text></View>;

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Convite de Responsável</Text>
      </View>
      <View style={styles.corpo}>
        <Text style={styles.desc}>Você foi convidado a ser responsável por:</Text>
        <Text style={styles.membro}>{convite?.membro?.nome}</Text>
        <Text style={styles.clube}>{convite?.clube?.nome}</Text>
        <TouchableOpacity style={[styles.botao, aceitando && { opacity: 0.6 }]} onPress={aceitar} disabled={aceitando}>
          {aceitando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Aceitar convite</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 60, paddingBottom: 20, alignItems: 'center' },
  titulo: { fontSize: 20, fontWeight: '700', color: '#fff' },
  corpo: { flex: 1, padding: 32, alignItems: 'center', gap: 12, marginTop: 40 },
  desc: { fontSize: 15, color: '#6b7280', textAlign: 'center' },
  membro: { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center' },
  clube: { fontSize: 15, color: '#1a56db', fontWeight: '600' },
  botao: { backgroundColor: '#1a56db', borderRadius: 10, padding: 16, alignItems: 'center', width: '100%', marginTop: 24 },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  erro: { fontSize: 16, color: '#ef4444', textAlign: 'center' },
});
