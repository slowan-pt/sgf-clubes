import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/authStore';

export default function Mfa() {
  const router = useRouter();
  const setMfaVerificado = useAuthStore((s) => s.setMfaVerificado);
  const [codigo, setCodigo] = useState('');
  const [fatores, setFatores] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      setFatores(data?.totp ?? []);
    });
  }, []);

  async function verificar() {
    if (!codigo || fatores.length === 0) return;

    setCarregando(true);
    const fator = fatores[0];

    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId: fator.id });
    if (!challenge) {
      Alert.alert('Erro', 'Não foi possível iniciar o desafio MFA.');
      setCarregando(false);
      return;
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId: fator.id,
      challengeId: challenge.id,
      code: codigo,
    });

    setCarregando(false);

    if (error) {
      Alert.alert('Código inválido', 'Verifique o código e tente novamente.');
      return;
    }

    setMfaVerificado(true);
    router.replace('/');
  }

  return (
    <View style={styles.tela}>
      <View style={styles.card}>
        <Text style={styles.titulo}>Verificação MFA</Text>
        <Text style={styles.desc}>
          Abra o Google Authenticator e insira o código de 6 dígitos.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="000000"
          placeholderTextColor="#9ca3af"
          value={codigo}
          onChangeText={setCodigo}
          keyboardType="numeric"
          maxLength={6}
          textAlign="center"
        />

        <TouchableOpacity style={styles.botao} onPress={verificar} disabled={carregando}>
          {carregando
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.botaoTexto}>Verificar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#1a56db',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
  },
  titulo: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  desc: { fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 14,
    fontSize: 24,
    marginBottom: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
    letterSpacing: 8,
  },
  botao: {
    backgroundColor: '#1a56db',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
