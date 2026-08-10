import React, { useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiCall, ApiError } from '@/src/api/client';
import type { Proposal, ProposalCategory, ProposalTemplate } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { useToast } from '@/components/ToastProvider';
import { showConfirm } from '@/components/ConfirmDialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { UIBottomSheet, UIButton, UICard, UIChip, UIEmptyState, UIHeader, UIInput } from '@/src/ui';
import { spacing } from '@/src/theme';

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
      <View style={[styles.header, { paddingTop: topPad + spacing.md, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <UIButton variant="ghost" iconLeft="arrow-left" size="sm" onPress={() => router.back()} accessibilityLabel="Voltar" />
        <UIHeader
          title="Modelos de Proposta"
          subtitle="Crie propostas rapidamente a partir de modelos."
          style={styles.headerCopy}
          action={<UIButton iconLeft="plus" title="Novo" size="sm" onPress={() => openForm(null)} />}
        />
      </View>

      {query.isLoading ? <LoadingSpinner message="Carregando..." /> : (
        <ScrollView refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={query.refetch} />} contentContainerStyle={styles.list}>
          {!query.data?.length && <UIEmptyState icon="file-text" title="Nenhum modelo cadastrado" />}
          {(query.data ?? []).map((template) => (
            <UICard key={template.id} variant="elevated" style={styles.card}>
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
                <UIButton iconLeft="play" title="Usar modelo" size="sm" style={styles.action} onPress={() => useTemplateMutation.mutate(template.id)} />
                <UIButton variant="outline" iconLeft="edit-2" size="sm" title="Editar" onPress={() => openForm(template)} />
                <UIButton
                  variant="destructive"
                  iconLeft="trash-2"
                  size="sm"
                  title="Excluir"
                  onPress={() => showConfirm({
                    title: 'Excluir modelo?',
                    message: `${template.name} sera removido do catalogo de modelos.`,
                    confirmText: 'Excluir',
                    destructive: true,
                    onConfirm: () => deleteMutation.mutate(template.id),
                  })}
                />
              </View>
            </UICard>
          ))}
        </ScrollView>
      )}

      <UIBottomSheet visible={editing !== undefined} onClose={() => setEditing(undefined)}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{editing ? 'Editar modelo' : 'Novo modelo'}</Text>
            <UIInput value={name} onChangeText={setName} placeholder="Nome do modelo" />
            <UIInput value={propType} onChangeText={setPropType} placeholder="Tipo exibido na proposta" />
            <UIInput containerStyle={styles.descriptionInput} style={styles.descriptionTextInput} value={description} onChangeText={setDescription} placeholder="Descricao interna" multiline />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Programa/Categoria</Text>
            <ScrollView horizontal contentContainerStyle={styles.categories}>
              {(categoriesQuery.data ?? []).map((category) => (
                <UIChip key={category.id} label={category.name} active={categoryId === category.id} onPress={() => setCategoryId(category.id)} />
              ))}
            </ScrollView>
            <UIButton
              title="Salvar modelo"
              disabled={!name.trim() || !propType.trim() || !categoryId || saveMutation.isPending}
              onPress={() => saveMutation.mutate()}
            />
      </UIBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerCopy: { flex: 1 },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: 44 },
  card: { gap: spacing.sm },
  cardHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3 },
  usage: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  description: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  action: { flex: 1 },
  sheetTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  descriptionInput: { minHeight: 84 },
  descriptionTextInput: { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  categories: { gap: spacing.sm },
});
