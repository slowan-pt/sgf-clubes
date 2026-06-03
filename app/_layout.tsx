import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { registrarServiceWorker } from '../src/lib/pwa';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  const inicializar = useAuthStore((s) => s.inicializar);

  useEffect(() => {
    inicializar();
    registrarServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/mfa" />
        <Stack.Screen name="auth/consent" />
        <Stack.Screen name="auth/contexto" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="membro/[id]" />
        <Stack.Screen name="admin/acessos" />
        <Stack.Screen name="admin/aparencia" />
        <Stack.Screen name="admin/auditoria" />
        <Stack.Screen name="admin/clubes" />
        <Stack.Screen name="admin/lgpd" />
        <Stack.Screen name="admin/mensagens" />
        <Stack.Screen name="admin/modelos" />
        <Stack.Screen name="admin/pre-cadastros" />
        <Stack.Screen name="admin/vincular-usuarios" />
        <Stack.Screen name="admin/classificacao" />
        <Stack.Screen name="admin/ranking-clubes" />
        <Stack.Screen name="relatorios/index" />
        <Stack.Screen name="importar/index" />
        <Stack.Screen name="extrato/[dbv_id]" />
        <Stack.Screen name="convite/[token]" />
        <Stack.Screen name="pre-cadastro/[token]" />
        <Stack.Screen name="classe-biblica/index" />
        <Stack.Screen name="perfil" />
      </Stack>
    </QueryClientProvider>
  );
}
