import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePermissoes } from '../../src/lib/permissoes';

export default function TabsLayout() {
  const { pode } = usePermissoes();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1a56db',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e5e7eb',
          paddingBottom: 20,
          height: 70,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="membros"
        options={{
          title: 'Membros',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pontuacao"
        options={{
          title: 'Pontuação',
          href: pode('gerenciar_pontuacao') ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="atividades"
        options={{
          title: 'Atividades',
          tabBarIcon: ({ color, size }) => <Ionicons name="clipboard" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="extras" options={{ href: null }} />
      <Tabs.Screen name="unidades" options={{ href: null }} />
      <Tabs.Screen name="campori" options={{ href: null }} />
      <Tabs.Screen name="mensagens" options={{ href: null }} />
      <Tabs.Screen name="anexo" options={{ href: null }} />
    </Tabs>
  );
}
