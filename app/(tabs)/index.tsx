import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { useContextoStore } from '../../src/stores/contextoStore';
import { usePermissoes } from '../../src/lib/permissoes';
import { supabase } from '../../src/lib/supabase';
import { getClubeAtivoId } from '../../src/lib/contextoAtual';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Atalho {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  rota: string;
  cor: string;
  permissao?: string;
}

const ATALHOS: Atalho[] = [
  { label: 'Ranking', icon: 'trophy', rota: '/(tabs)/ranking', cor: '#f59e0b' },
  { label: 'Membros', icon: 'people', rota: '/(tabs)/membros', cor: '#3b82f6' },
  { label: 'Agenda', icon: 'calendar', rota: '/(tabs)/calendario', cor: '#10b981' },
  { label: 'Atividades', icon: 'clipboard', rota: '/(tabs)/atividades', cor: '#8b5cf6' },
  { label: 'Classe Bíblica', icon: 'book', rota: '/classe-biblica', cor: '#ec4899' },
  { label: 'Avisos', icon: 'megaphone', rota: '/(tabs)/mensagens', cor: '#f97316' },
  { label: 'Pontuação', icon: 'checkmark-circle', rota: '/(tabs)/pontuacao', cor: '#1a56db', permissao: 'gerenciar_pontuacao' },
  { label: 'Extras', icon: 'star', rota: '/(tabs)/extras', cor: '#eab308', permissao: 'gerenciar_pontuacao' },
  { label: 'Unidades', icon: 'flag', rota: '/(tabs)/unidades', cor: '#14b8a6', permissao: 'gerenciar_unidades' },
  { label: 'Importar', icon: 'cloud-upload', rota: '/importar', cor: '#6366f1', permissao: 'gerenciar_membros' },
  { label: 'Relatórios', icon: 'bar-chart', rota: '/relatorios', cor: '#64748b', permissao: 'ver_relatorios' },
  { label: 'Pré-cadastros', icon: 'person-add', rota: '/admin/pre-cadastros', cor: '#06b6d4', permissao: 'gerenciar_membros' },
  { label: 'Mensagens', icon: 'send', rota: '/admin/mensagens', cor: '#f43f5e', permissao: 'enviar_mensagens' },
  { label: 'Aparência', icon: 'color-palette', rota: '/admin/aparencia', cor: '#a78bfa', permissao: 'admin_clube' },
  { label: 'Clubes', icon: 'business', rota: '/admin/clubes', cor: '#0ea5e9', permissao: 'admin_plataforma' },
  { label: 'Perfil', icon: 'person-circle', rota: '/perfil', cor: '#78716c' },
];

export default function Dashboard() {
  const router = useRouter();
  const { pode } = usePermissoes();
  const contexto = useContextoStore((s) => s.contextoAtivo);
  const logout = useAuthStore((s) => s.logout);
  const [aniversariantes, setAniversariantes] = useState<any[]>([]);

  useEffect(() => {
    carregarAniversariantes();
  }, [contexto]);

  async function carregarAniversariantes() {
    const clube_id = getClubeAtivoId();
    if (!clube_id) return;

    const hoje = format(new Date(), 'MM-dd');
    const { data } = await supabase
      .from('desbravadores')
      .select('id, nome, data_nascimento')
      .eq('clube_id', clube_id)
      .eq('ativo', true);

    const aniv = (data ?? []).filter((m: any) => {
      if (!m.data_nascimento) return false;
      const md = m.data_nascimento.slice(5);
      return md === hoje;
    });

    setAniversariantes(aniv);
  }

  const atalhosFiltrados = ATALHOS.filter((a) =>
    !a.permissao || pode(a.permissao as any),
  );

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <View style={styles.cabecalhoRow}>
          <View>
            <Text style={styles.bemVindo}>SGF Clubes</Text>
            <Text style={styles.clube}>{contexto?.clube_nome ?? ''}</Text>
          </View>
          <TouchableOpacity onPress={() => { logout(); router.replace('/auth/login'); }}>
            <Ionicons name="log-out-outline" size={26} color="#bfdbfe" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.corpo}>
        {aniversariantes.length > 0 && (
          <View style={styles.anivCard}>
            <Ionicons name="gift" size={20} color="#f59e0b" />
            <Text style={styles.anivTexto}>
              🎂 {aniversariantes.map((a) => a.nome).join(', ')}
            </Text>
          </View>
        )}

        <Text style={styles.secaoTitulo}>Acesso Rápido</Text>

        <View style={styles.grid}>
          {atalhosFiltrados.map((a) => (
            <TouchableOpacity
              key={a.rota}
              style={styles.card}
              onPress={() => router.push(a.rota as any)}
            >
              <View style={[styles.cardIcone, { backgroundColor: a.cor + '20' }]}>
                <Ionicons name={a.icon} size={26} color={a.cor} />
              </View>
              <Text style={styles.cardLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f9fafb' },
  cabecalho: {
    backgroundColor: '#1a56db',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cabecalhoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bemVindo: { fontSize: 22, fontWeight: '800', color: '#fff' },
  clube: { fontSize: 14, color: '#bfdbfe', marginTop: 2 },
  corpo: { padding: 16 },
  anivCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  anivTexto: { flex: 1, fontSize: 14, color: '#92400e' },
  secaoTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    minWidth: 90,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcone: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});
