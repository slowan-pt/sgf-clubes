import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { getClubeAtivoId } from '../../src/lib/contextoAtual';

export default function Importar() {
  const router = useRouter();
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<{ importados: number; erros: number } | null>(null);

  async function selecionarArquivo() {
    if (Platform.OS !== 'web') {
      Alert.alert('Importação disponível apenas no navegador.');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      processarArquivo(file);
    };
    input.click();
  }

  async function processarArquivo(file: File) {
    const clube_id = getClubeAtivoId();
    if (!clube_id) return;

    setImportando(true);
    setResultado(null);

    try {
      const { read, utils } = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = utils.sheet_to_json(ws);

      let importados = 0;
      let erros = 0;

      for (const row of rows) {
        const nome = row['Nome'] || row['nome'] || row['NOME'];
        if (!nome) { erros++; continue; }

        const { error } = await supabase.from('desbravadores').upsert({
          clube_id,
          nome: String(nome).trim(),
          data_nascimento: row['Nascimento'] || row['data_nascimento'] || null,
          email: row['Email'] || row['email'] || null,
          telefone: row['Telefone'] || row['telefone'] || null,
          ativo: true,
        });

        if (error) { erros++; } else { importados++; }
      }

      setResultado({ importados, erros });
    } catch (err) {
      Alert.alert('Erro na importação', String(err));
    } finally {
      setImportando(false);
    }
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.titulo}>Importar Membros</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.corpo}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#3b82f6" />
          <Text style={styles.infoTexto}>
            Importe membros a partir de uma planilha Excel (.xlsx) ou CSV.{'\n\n'}
            Colunas reconhecidas: <Text style={{ fontWeight: '700' }}>Nome</Text>, Nascimento, Email, Telefone.
          </Text>
        </View>

        <TouchableOpacity style={styles.botao} onPress={selecionarArquivo} disabled={importando}>
          {importando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.botaoConteudo}>
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.botaoTexto}>Selecionar planilha</Text>
            </View>
          )}
        </TouchableOpacity>

        {resultado && (
          <View style={styles.resultadoCard}>
            <Text style={styles.resultadoTitulo}>Resultado da importação</Text>
            <Text style={styles.resultadoOk}>✓ {resultado.importados} membros importados</Text>
            {resultado.erros > 0 && (
              <Text style={styles.resultadoErro}>✕ {resultado.erros} linhas com erro</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 18, fontWeight: '700', color: '#fff' },
  corpo: { flex: 1, padding: 20, gap: 16 },
  infoCard: { backgroundColor: '#eff6ff', borderRadius: 12, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  infoTexto: { flex: 1, fontSize: 14, color: '#1e40af', lineHeight: 20 },
  botao: { backgroundColor: '#1a56db', borderRadius: 10, padding: 14, alignItems: 'center' },
  botaoConteudo: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resultadoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 6 },
  resultadoTitulo: { fontSize: 15, fontWeight: '700', color: '#111827' },
  resultadoOk: { fontSize: 14, color: '#15803d' },
  resultadoErro: { fontSize: 14, color: '#dc2626' },
});
