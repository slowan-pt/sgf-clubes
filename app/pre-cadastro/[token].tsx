import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { DateField } from '../../src/components/DateField';

export default function PreCadastro() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [clube, setClube] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', data_nascimento: '' });
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => { carregarClube(); }, [token]);

  async function carregarClube() {
    const { data } = await supabase.from('clubes').select('*').eq('codigo', token).single();
    setClube(data);
    setCarregando(false);
  }

  async function enviar() {
    if (!form.nome) { Alert.alert('Informe seu nome.'); return; }
    if (!clube) return;

    setEnviando(true);
    const { error } = await supabase.from('pre_cadastros').insert({
      clube_id: clube.id,
      token,
      ...form,
      status: 'pendente',
    });
    setEnviando(false);

    if (error) { Alert.alert('Erro ao enviar', error.message); return; }
    setEnviado(true);
  }

  if (carregando) return <View style={styles.centro}><ActivityIndicator color="#1a56db" /></View>;

  if (!clube) return (
    <View style={styles.centro}>
      <Text style={styles.erro}>Link inválido ou clube não encontrado.</Text>
    </View>
  );

  if (enviado) return (
    <View style={styles.centro}>
      <Text style={styles.ok}>✓ Pré-cadastro enviado!</Text>
      <Text style={styles.okDesc}>Aguarde a aprovação da direção do clube.</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.tela}>
      <View style={[styles.cabecalho, { backgroundColor: clube.cor_primaria }]}>
        <Text style={styles.clubeNome}>{clube.nome}</Text>
        <Text style={styles.cadastroTitulo}>Pré-cadastro</Text>
      </View>

      <View style={styles.form}>
        {[
          { campo: 'nome', label: 'Nome completo *', placeholder: 'Seu nome' },
          { campo: 'email', label: 'E-mail', placeholder: 'seu@email.com' },
          { campo: 'telefone', label: 'Telefone', placeholder: '(11) 99999-9999' },
        ].map(({ campo, label, placeholder }) => (
          <View key={campo} style={styles.grupo}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              value={(form as any)[campo]}
              onChangeText={(v) => setForm((f) => ({ ...f, [campo]: v }))}
              placeholder={placeholder}
              placeholderTextColor="#9ca3af"
              autoCapitalize={campo === 'email' ? 'none' : 'words'}
              keyboardType={campo === 'email' ? 'email-address' : campo === 'telefone' ? 'phone-pad' : 'default'}
            />
          </View>
        ))}

        <DateField label="Data de nascimento" value={form.data_nascimento} onChange={(v) => setForm((f) => ({ ...f, data_nascimento: v }))} />

        <TouchableOpacity
          style={[styles.botao, { backgroundColor: clube.cor_primaria }, enviando && { opacity: 0.6 }]}
          onPress={enviar}
          disabled={enviando}
        >
          {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Enviar pré-cadastro</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: { flexGrow: 1, backgroundColor: '#f9fafb' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  cabecalho: { padding: 32, paddingTop: 60, alignItems: 'center' },
  clubeNome: { fontSize: 22, fontWeight: '800', color: '#fff' },
  cadastroTitulo: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  form: { padding: 20, gap: 12 },
  grupo: { gap: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827', backgroundColor: '#fff' },
  botao: { borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ok: { fontSize: 24, color: '#22c55e', fontWeight: '800', marginBottom: 8 },
  okDesc: { fontSize: 15, color: '#6b7280', textAlign: 'center' },
  erro: { fontSize: 16, color: '#ef4444', textAlign: 'center' },
});
