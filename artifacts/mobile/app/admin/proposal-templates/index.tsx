import React, { useState } from 'react';
import { Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiCall, ApiError } from '@/src/api/client';
import type { Proposal, ProposalCategory, ProposalTemplate } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { useToast } from '@/components/ToastProvider';
import { showConfirm } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function ProposalTemplatesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<ProposalTemplate | null | undefined>(undefined);
  const [name, setName] = useState('');
  const [propType, setPropType] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const query = useQuery({
    queryKey: ['proposal-templates'],
    queryFn: () => apiCall<ProposalTemplate[]>('GET', '/proposal-templates'),
  });
  const categoriesQuery = useQuery({
    queryKey: ['proposal-categories', 'templates-form'],
    queryFn: () => apiCall<ProposalCategory[]>('GET', '/proposal-categories?active=true'),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        propType: propType.trim(),
        description: description.trim() || undefined,
        categoryId,
        active: true,
        stats: [],
        products: editing?.products ?? [],
      };
      return apiCall<ProposalTemplate>(editing ? 'PATCH' : 'POST', editing ? `/proposal-templates/${editing.id}` : '/proposal-templates', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-templates'] });
      setEditing(undefined);
      showToast(editing ? 'Modelo atualizado.' : 'Modelo criado.', 'success');
    },
    onError: (error) => showToast(error instanceof ApiError ? error.message : 'Nao foi possivel salvar o modelo.', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiCall('DELETE', `/proposal-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-templates'] });
      showToast('Modelo removido.', 'error');
    },
    onError: (error) => showToast(error instanceof ApiError ? error.message : 'Nao foi possivel remover.', 'error'),
  });

  const useTemplateMutation = useMutation({
    mutationFn: (id: string) => apiCall<Proposal>('POST', `/proposal-templates/${id}/use`),
    onSuccess: (proposal) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      showToast('Proposta criada a partir do modelo.', 'success');
      router.push(`/proposal/${proposal.id}`);
    },
    onError: (error) => showToast(error instanceof ApiError ? error.message : 'Nao foi possivel usar o modelo.', 'error'),
  });

  function openForm(template: ProposalTemplate | null) {
    setEditing(template);
    setName(template?.name ?? '');
    setPropType(template?.propType ?? '');
    setDescription(template?.description ?? '');
    setCategoryId(template?.categoryId ?? categoriesQuery.data?.[0]?.id ?? '');
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.foreground} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Modelos de Proposta</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Crie propostas rapidamente a partir de modelos.</Text>
        </View>
        <TouchableOpacity style={[styles.add, { backgroundColor: colors.primary }]} onPress={() => openForm(null)}>
          <Feather name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {query.isLoading ? <LoadingSpinner message="Carregando..." /> : (
        <ScrollView refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={query.refetch} />} contentContainerStyle={styles.list}>
          {!query.data?.length && <EmptyState icon="file-text" title="Nenhum modelo cadastrado" />}
          {(query.data ?? []).map((template) => (
            <View key={template.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{template.name}</Text>
                  <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                    {[template.propType, template.category?.name, `${template.products?.length ?? 0} produtos`].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Text style={[styles.usage, { color: colors.primary }]}>{template.usageCount ?? 0} usos</Text>
              </View>
              {!!template.description && <Text style={[styles.description, { color: colors.mutedForeground }]}>{template.description}</Text>}
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.action, { backgroundColor: colors.primary }]} onPress={() => useTemplateMutation.mutate(template.id)}>
                  <Feather name="play" size={15} color="#FFF" />
                  <Text style={styles.actionPrimaryText}>Usar modelo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconAction, { borderColor: colors.border }]} onPress={() => openForm(template)}>
                  <Feather name="edit-2" size={16} color={colors.foreground} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconAction, { borderColor: colors.destructive + '40' }]}
                  onPress={() => showConfirm({
                    title: 'Excluir modelo?',
                    message: `${template.name} sera removido do catalogo de modelos.`,
                    confirmText: 'Excluir',
                    destructive: true,
                    onConfirm: () => deleteMutation.mutate(template.id),
                  })}
                >
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal transparent visible={editing !== undefined} animationType="slide" onRequestClose={() => setEditing(undefined)}>
        <Pressable style={styles.backdrop} onPress={() => setEditing(undefined)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(event) => event.stopPropagation()}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{editing ? 'Editar modelo' : 'Novo modelo'}</Text>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground }]} value={name} onChangeText={setName} placeholder="Nome do modelo" placeholderTextColor={colors.mutedForeground} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground }]} value={propType} onChangeText={setPropType} placeholder="Tipo exibido na proposta" placeholderTextColor={colors.mutedForeground} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, minHeight: 78 }]} value={description} onChangeText={setDescription} placeholder="Descricao interna" placeholderTextColor={colors.mutedForeground} multiline />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Programa/Categoria</Text>
            <ScrollView horizontal contentContainerStyle={styles.categories}>
              {(categoriesQuery.data ?? []).map((category) => (
                <TouchableOpacity key={category.id} style={[styles.chip, { borderColor: categoryId === category.id ? colors.primary : colors.border, backgroundColor: categoryId === category.id ? colors.primary + '12' : colors.card }]} onPress={() => setCategoryId(category.id)}>
                  <Text style={{ color: categoryId === category.id ? colors.primary : colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              disabled={!name.trim() || !propType.trim() || !categoryId || saveMutation.isPending}
              style={[styles.save, { backgroundColor: name.trim() && propType.trim() && categoryId ? colors.primary : colors.muted }]}
              onPress={() => saveMutation.mutate()}
            >
              <Text style={styles.saveText}>Salvar modelo</Text>
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
  list: { padding: 12, gap: 12, paddingBottom: 44 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3 },
  usage: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  description: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  action: { minHeight: 42, borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, flex: 1 },
  actionPrimaryText: { color: '#FFF', fontSize: 13, fontFamily: 'Inter_700Bold' },
  iconAction: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.45)' },
  sheet: { padding: 20, paddingBottom: 36, borderTopLeftRadius: 16, borderTopRightRadius: 16, gap: 12 },
  sheetTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Inter_400Regular' },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  categories: { gap: 8 },
  chip: { minHeight: 40, borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  save: { minHeight: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFF', fontFamily: 'Inter_600SemiBold' },
});
