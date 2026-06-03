import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';

interface Props {
  label?: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function DateField({ label, value, onChange, placeholder = 'DD/MM/AAAA' }: Props) {
  const [raw, setRaw] = useState(value ? formatarParaExibicao(value) : '');

  function formatarParaExibicao(iso: string) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  function handleChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setRaw(formatted);

    if (digits.length === 8) {
      const iso = `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
      onChange(iso);
    }
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        value={raw}
        onChangeText={handleChange}
        placeholder={placeholder}
        keyboardType="numeric"
        maxLength={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#111827',
  },
});
