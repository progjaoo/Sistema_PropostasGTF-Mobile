import React, { useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiCall, ApiError } from '@/src/api/client';
import type { ProductDuration } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { useToast } from '@/components/ToastProvider';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { UIBottomSheet, UIButton, UICard, UIEmptyState, UIHeader, UIInput } from '@/src/ui';
import { spacing } from '@/src/theme';

export default function ProductDurationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [seconds, setSeconds] = useState('');
  const [order, setOrder] = useState('0');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const query = useQuery({
    queryKey: ['product-durations'],
    queryFn: () => apiCall<ProductDuration[]>('GET', '/product-durations'),
  });

  const createMutation = useMutation({
    mutationFn: () => apiCall<ProductDuration>('POST', '/product-durations', {
      label: label.trim(),
      seconds: seconds.trim() ? Number(seconds.replace(/\D/g, '')) : null,
      order: Number(order || 0),
      active: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-durations'] });
      setModalOpen(false);
      setLabel('');
      setSeconds('');
      setOrder('0');
      showToast('Duracao criada.', 'success');
    },
    onError: (error) => showToast(error instanceof ApiError ? error.message : 'Nao foi possivel criar a duracao.', 'error'),
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + spacing.md, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <UIButton variant="ghost" iconLeft="arrow-left" size="sm" onPress={() => router.back()} accessibilityLabel="Voltar" />
        <UIHeader
          title="Durações de Produto"
          subtitle="Cadastre opções como 15s, 30s ou 120s."
          style={styles.headerCopy}
          action={<UIButton iconLeft="plus" title="Nova" size="sm" onPress={() => setModalOpen(true)} />}
        />
      </View>
      {query.isLoading ? <LoadingSpinner message="Carregando..." /> : (
        <ScrollView refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={query.refetch} />} contentContainerStyle={styles.list}>
          {!query.data?.length && <UIEmptyState icon="clock" title="Nenhuma duração cadastrada" />}
          {(query.data ?? []).map((item) => (
            <UICard key={item.id} variant="elevated" style={styles.row}>
              <View style={[styles.icon, { backgroundColor: colors.accent }]}>
                <Feather name="clock" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                  {[item.seconds ? `${item.seconds}s` : null, `ordem ${item.order ?? 0}`].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </UICard>
          ))}
        </ScrollView>
      )}
      <UIBottomSheet visible={modalOpen} onClose={() => setModalOpen(false)}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Nova duracao</Text>
            <UIInput value={label} onChangeText={setLabel} placeholder="Ex: 30s" />
            <UIInput value={seconds} onChangeText={setSeconds} keyboardType="number-pad" placeholder="Segundos (opcional)" />
            <UIInput value={order} onChangeText={setOrder} keyboardType="number-pad" placeholder="Ordem" />
            <UIButton
              title="Salvar duração"
              disabled={!label.trim() || createMutation.isPending}
              onPress={() => createMutation.mutate()}
            />
      </UIBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerCopy: { flex: 1 },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 44 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  sheetTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
});
