import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/stores/authStore';
import { useContextoStore } from '../src/stores/contextoStore';
import { verificarConsentimento } from '../src/lib/lgpd';

export default function Index() {
  const router = useRouter();
  const { session, carregando } = useAuthStore();
  const { contextoAtivo, contextos, carregarContextos } = useContextoStore();

  useEffect(() => {
    if (carregando) return;

    if (!session) {
      router.replace('/auth/login');
      return;
    }

    const iniciar = async () => {
      await carregarContextos(session.user.id);

      const lgpdOk = await verificarConsentimento(session.user.id);
      if (!lgpdOk) {
        router.replace('/auth/consent');
        return;
      }

      const store = useContextoStore.getState();
      if (!store.contextoAtivo && store.contextos.length > 1) {
        router.replace('/auth/contexto');
        return;
      }

      router.replace('/(tabs)');
    };

    iniciar();
  }, [session, carregando]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a56db' }}>
      <ActivityIndicator color="#fff" size="large" />
    </View>
  );
}
