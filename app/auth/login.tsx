import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/authStore';

export default function Login() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }

    setCarregando(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);

    if (error) {
      Alert.alert('Erro ao entrar', error.message);
      return;
    }

    setSession(data.session);

    // Verifica se precisa de MFA
    const { data: mfa } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (mfa?.nextLevel === 'aal2' && mfa.currentLevel !== 'aal2') {
      router.replace('/auth/mfa');
      return;
    }

    router.replace('/');
  }

  return (
    <KeyboardAvoidingView
      style={styles.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.titulo}>SGF Clubes</Text>
        <Text style={styles.subtitulo}>Desbravadores & Aventureiros</Text>

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#9ca3af"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <TouchableOpacity style={styles.botao} onPress={entrar} disabled={carregando}>
          {carregando
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.botaoTexto}>Entrar</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a56db',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 28,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  botao: {
    backgroundColor: '#1a56db',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
