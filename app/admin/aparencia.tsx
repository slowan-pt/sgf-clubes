import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { getClubeAtivoId } from '../../src/lib/contextoAtual';

const CORES_SUGERIDAS = ['#1a56db','#2563eb','#7c3aed','#059669','#dc2626','#d97706','#0891b2'];

export default function Aparencia() {
  const router = useRouter();
  const [clube, setClube] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', nome_curto: '', cor_primaria: '#1a56db', cor_secundaria: '#1e429f', logo_url: '' });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const clube_id = getClubeAtivoId();
    const { data } = await supabase.from('clubes').select('*').eq('id', clube_id).single();
    setClube(data);
    if (data) setForm({ nome: data.nome, nome_curto: data.nome_curto ?? '', cor_primaria: data.cor_primaria, cor_secundaria: data.cor_secundaria, logo_url: data.logo_url ?? '' });
  }

  async function salvar() {
    const clube_id = getClubeAtivoId();
    setSalvando(true);
    const { error } = await supabase.from('clubes').update(form).eq('id', clube_id);
    setSalvando(false);
    if (error) { Alert.alert('Erro', error.message); return; }
    Alert.alert('Aparência salva!');
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Aparência do Clube</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.corpo}>
        {[
          { campo: 'nome', label: 'Nome do clube' },
          { campo: 'nome_curto', label: 'Nome curto' },
          { campo: 'logo_url', label: 'URL do logo' },
        ].map(({ campo, label }) => (
          <View key={campo} style={styles.grupo}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              value={(form as any)[campo]}
              onChangeText={(v) => setForm((f) => ({ ...f, [campo]: v }))}
              placeholder={label}
              placeholderTextColor="#9ca3af"
            />
          </View>
        ))}

        <View style={styles.grupo}>
          <Text style={styles.label}>Cor primária</Text>
          <View style={styles.coresRow}>
            {CORES_SUGERIDAS.map((cor) => (
              <TouchableOpacity
                key={cor}
                style={[styles.corChip, { backgroundColor: cor }, form.cor_primaria === cor && styles.corChipSel]}
                onPress={() => setForm((f) => ({ ...f, cor_primaria: cor }))}
              />
            ))}
          </View>
          <TextInput style={styles.input} value={form.cor_primaria} onChangeText={(v) => setForm((f) => ({ ...f, cor_primaria: v }))} placeholderTextColor="#9ca3af" />
        </View>

        <View style={[styles.preview, { backgroundColor: form.cor_primaria }]}>
          <Text style={styles.previewTexto}>{form.nome || 'Prévia do clube'}</Text>
        </View>

        <TouchableOpacity style={[styles.botao, salvando && { opacity: 0.6 }]} onPress={salvar} disabled={salvando}>
          {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Salvar</Text>}
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
  grupo: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827', backgroundColor: '#fff' },
  coresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  corChip: { width: 36, height: 36, borderRadius: 18 },
  corChipSel: { borderWidth: 3, borderColor: '#111827' },
  preview: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  previewTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  botao: { backgroundColor: '#1a56db', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
