import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface Props {
  nome?: string;
  url?: string;
  tamanho?: number;
  cor?: string;
}

export function Avatar({ nome = '', url, tamanho = 40, cor = '#1a56db' }: Props) {
  const iniciais = nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  const estilo = {
    width: tamanho,
    height: tamanho,
    borderRadius: tamanho / 2,
    backgroundColor: cor,
  };

  if (url) {
    return <Image source={{ uri: url }} style={[styles.img, estilo]} />;
  }

  return (
    <View style={[styles.container, estilo]}>
      <Text style={[styles.texto, { fontSize: tamanho * 0.36 }]}>{iniciais}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {
    resizeMode: 'cover',
  },
  texto: {
    color: '#fff',
    fontWeight: '700',
  },
});
