import React, { useState } from 'react';
import { Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiCall, ApiError } from '@/src/api/client';
import type { ProductDuration } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { useToast } from '@/components/ToastProvider';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';

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
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.foreground} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Duracoes de Produto</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Cadastre opcoes como 15s, 30s ou 120s.</Text>
        </View>
        <TouchableOpacity style={[styles.add, { backgroundColor: colors.primary }]} onPress={() => setModalOpen(true)}>
          <Feather name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
      {query.isLoading ? <LoadingSpinner message="Carregando..." /> : (
        <ScrollView refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={query.refetch} />} contentContainerStyle={styles.list}>
          {!query.data?.length && <EmptyState icon="clock" title="Nenhuma duracao cadastrada" />}
          {(query.data ?? []).map((item) => (
            <View key={item.id} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.icon, { backgroundColor: colors.accent }]}>
                <Feather name="clock" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                  {[item.seconds ? `${item.seconds}s` : null, `ordem ${item.order ?? 0}`].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      <Modal transparent visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setModalOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(event) => event.stopPropagation()}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Nova duracao</Text>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground }]} value={label} onChangeText={setLabel} placeholder="Ex: 30s" placeholderTextColor={colors.mutedForeground} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground }]} value={seconds} onChangeText={setSeconds} keyboardType="number-pad" placeholder="Segundos (opcional)" placeholderTextColor={colors.mutedForeground} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground }]} value={order} onChangeText={setOrder} keyboardType="number-pad" placeholder="Ordem" placeholderTextColor={colors.mutedForeground} />
            <TouchableOpacity
              disabled={!label.trim() || createMutation.isPending}
              style={[styles.save, { backgroundColor: label.trim() ? colors.primary : colors.muted }]}
              onPress={() => createMutation.mutate()}
            >
              <Text style={styles.saveText}>Salvar duracao</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 19 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  add: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12, gap: 10, paddingBottom: 44 },
  row: { borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.45)' },
  sheet: { padding: 20, paddingBottom: 36, borderTopLeftRadius: 16, borderTopRightRadius: 16, gap: 12 },
  sheetTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontFamily: 'Inter_400Regular' },
  save: { minHeight: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFF', fontFamily: 'Inter_600SemiBold' },
});
