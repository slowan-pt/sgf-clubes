import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface NavItem {
  label: string;
  rota: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ITENS: NavItem[] = [
  { label: 'Início', rota: '/(tabs)', icon: 'home' },
  { label: 'Membros', rota: '/(tabs)/membros', icon: 'people' },
  { label: 'Agenda', rota: '/(tabs)/calendario', icon: 'calendar' },
  { label: 'Atividades', rota: '/(tabs)/atividades', icon: 'clipboard' },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {ITENS.map((item) => {
        const ativo = pathname === item.rota || pathname.startsWith(item.rota + '/');
        return (
          <TouchableOpacity
            key={item.rota}
            style={styles.item}
            onPress={() => router.push(item.rota as any)}
          >
            <Ionicons
              name={ativo ? item.icon : `${item.icon}-outline` as any}
              size={24}
              color={ativo ? '#1a56db' : '#6b7280'}
            />
            <Text style={[styles.label, ativo && styles.labelAtivo]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 20,
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    color: '#6b7280',
  },
  labelAtivo: {
    color: '#1a56db',
    fontWeight: '600',
  },
});
