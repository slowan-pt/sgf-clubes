import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { getClubeAtivoId } from '../../src/lib/contextoAtual';
import { useAuthStore } from '../../src/stores/authStore';

export default function EnviarMensagem() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function enviar() {
    if (!titulo || !corpo) { Alert.alert('Preencha título e mensagem.'); return; }
    const clube_id = getClubeAtivoId();
    setSalvando(true);
    const { error } = await supabase.from('mensagens_clube').insert({
      clube_id,
      titulo,
      corpo,
      autor_id: session?.user.id,
    });
    setSalvando(false);
    if (error) { Alert.alert('Erro ao enviar', error.message); return; }
    Alert.alert('Aviso enviado!', 'Todos os membros poderão visualizar.');
    setTitulo('');
    setCorpo('');
    router.back();
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Enviar Aviso</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.corpo}>
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Título do aviso"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Mensagem</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={corpo}
          onChangeText={setCorpo}
          placeholder="Escreva a mensagem para o clube..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={8}
        />

        <TouchableOpacity
          style={[styles.botao, salvando && { opacity: 0.6 }]}
          onPress={enviar}
          disabled={salvando}
        >
          {salvando
            ? <ActivityIndicator color="#fff" />
            : (
              <View style={styles.botaoConteudo}>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.botaoTexto}>Enviar para o clube</Text>
              </View>
            )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 18, fontWeight: '700', color: '#fff' },
  corpo: { flex: 1, padding: 20, gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827', backgroundColor: '#fff' },
  textarea: { height: 160, textAlignVertical: 'top' },
  botao: { backgroundColor: '#1a56db', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  botaoConteudo: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
