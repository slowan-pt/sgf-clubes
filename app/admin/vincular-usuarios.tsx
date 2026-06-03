import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { getClubeAtivoId } from '../../src/lib/contextoAtual';

export default function VincularUsuarios() {
  const router = useRouter();
  const [emailUsuario, setEmailUsuario] = useState('');
  const [nomeMembro, setNomeMembro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function vincular() {
    if (!emailUsuario || !nomeMembro) { Alert.alert('Preencha os campos.'); return; }
    const clube_id = getClubeAtivoId();

    const { data: usuario } = await supabase.from('usuarios').select('id').eq('email', emailUsuario).single();
    if (!usuario) { Alert.alert('Usuário não encontrado.'); return; }

    const { data: membro } = await supabase.from('desbravadores').select('id').eq('clube_id', clube_id).ilike('nome', `%${nomeMembro}%`).single();
    if (!membro) { Alert.alert('Membro não encontrado.'); return; }

    setSalvando(true);
    await supabase.from('usuario_clubes').upsert({ usuario_id: usuario.id, clube_id, membro_id: membro.id, perfil: 'usuario_desbravador', ativo: true });
    setSalvando(false);
    Alert.alert('Vínculo criado!');
    setEmailUsuario('');
    setNomeMembro('');
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.titulo}>Vincular Usuário</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.corpo}>
        <Text style={styles.desc}>Vincule um login (e-mail) a um membro do clube.</Text>
        <Text style={styles.label}>E-mail do usuário</Text>
        <TextInput style={styles.input} value={emailUsuario} onChangeText={setEmailUsuario} placeholder="usuario@email.com" autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#9ca3af" />
        <Text style={styles.label}>Nome do membro</Text>
        <TextInput style={styles.input} value={nomeMembro} onChangeText={setNomeMembro} placeholder="Parte do nome do membro" placeholderTextColor="#9ca3af" />
        <TouchableOpacity style={[styles.botao, salvando && { opacity: 0.6 }]} onPress={vincular} disabled={salvando}>
          {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Vincular</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 18, fontWeight: '700', color: '#fff' },
  corpo: { flex: 1, padding: 20, gap: 12 },
  desc: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827', backgroundColor: '#fff' },
  botao: { backgroundColor: '#1a56db', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
