import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function Anexo() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const router = useRouter();

  return (
    <View style={styles.tela}>
      <TouchableOpacity style={styles.fechar} onPress={() => router.back()}>
        <Text style={styles.fecharTexto}>✕ Fechar</Text>
      </TouchableOpacity>
      {url ? (
        <Image source={{ uri: url }} style={styles.imagem} resizeMode="contain" />
      ) : (
        <Text style={styles.erro}>URL do anexo não encontrada.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  fechar: { position: 'absolute', top: 56, left: 20, zIndex: 10 },
  fecharTexto: { color: '#fff', fontSize: 16, fontWeight: '600' },
  imagem: { width: '100%', height: '80%' },
  erro: { color: '#fff', fontSize: 16 },
});
