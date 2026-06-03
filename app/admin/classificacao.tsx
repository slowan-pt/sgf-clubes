import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Classificacao() {
  const router = useRouter();
  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.titulo}>Classificação SGC</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.corpo}>
        <Text style={styles.desc}>Classificação oficial do Sistema de Gestão de Clubes (SGC/DSA).</Text>
        <Text style={styles.info}>Esta tela exibirá os critérios de classificação do clube conforme o programa e a Divisão Sul-Americana.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: { backgroundColor: '#1a56db', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 18, fontWeight: '700', color: '#fff' },
  corpo: { padding: 20, gap: 12 },
  desc: { fontSize: 16, fontWeight: '700', color: '#111827' },
  info: { fontSize: 15, color: '#6b7280', lineHeight: 22 },
});
