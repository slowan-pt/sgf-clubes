import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ClasseBiblica() {
  const router = useRouter();

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.titulo}>Classe Bíblica</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.corpo}>
        <Text style={styles.subtitulo}>Jóias da Eternidade</Text>
        <Text style={styles.desc}>Estudo bíblico interativo com 14 episódios.</Text>
        {typeof window !== 'undefined' ? (
          <iframe
            src="/joias-da-eternidade.html"
            style={{ width: '100%', height: '80vh', border: 'none', borderRadius: 12 } as any}
            title="Jóias da Eternidade"
          />
        ) : (
          <Text style={styles.indisponivel}>Disponível apenas no navegador.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 18, fontWeight: '700', color: '#fff' },
  corpo: { flex: 1, padding: 16, gap: 12 },
  subtitulo: { fontSize: 18, fontWeight: '700', color: '#111827' },
  desc: { fontSize: 14, color: '#6b7280' },
  indisponivel: { color: '#9ca3af', textAlign: 'center', marginTop: 40 },
});
