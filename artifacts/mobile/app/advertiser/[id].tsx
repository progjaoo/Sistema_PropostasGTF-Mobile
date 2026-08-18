import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { FormInput } from '@/components/FormInput';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/components/ToastProvider';
import { ApiError } from '@/src/api/client';
import { AdvertiserStatus } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/src/store/authStore';
import { AdvertiserProposalList } from '@/src/features/advertisers/AdvertiserProposalList';
import { LeadSourcePicker } from '@/src/features/advertisers/LeadSourcePicker';
import { deactivateAdvertiser, getAdvertiser, getAdvertiserErrorMessage, listLeadSources, promoteAdvertiserToClient, saveAdvertiser } from '@/src/features/advertisers/api';
import { AdvertiserDeactivateAction } from '@/src/features/advertisers/AdvertiserDeactivateAction';
import { NativeBackButton } from '@/src/navigation/NativeBackButton';
import { queryKeys } from '@/src/api/queryKeys';
import { UIButton, UICard, UIChip, UIHeader } from '@/src/ui';
import { shadows, spacing, tokens } from '@/src/theme';

export default function AdvertiserDetailScreen() {
  const { id, status: requestedStatus, selectOnReturn } = useLocalSearchParams<{ id: string; status?: AdvertiserStatus; selectOnReturn?: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const isNew = id === 'new';

  const [tradeName, setTradeName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isDirty, setIsDirty] = useState(isNew);
  const [status, setStatus] = useState<AdvertiserStatus>('LEAD');
  const [leadSourceId, setLeadSourceId] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState('');

  const { data: advertiser, isLoading, isError, error: advertiserError } = useQuery({
    queryKey: queryKeys.advertisers.detail(id),
    queryFn: () => getAdvertiser(id),
    enabled: !isNew && !!id,
    staleTime: 30000,
  });
  const promoteMutation = useMutation({
    mutationFn: () => promoteAdvertiserToClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.advertisers.all });
      showToast('Lead convertido em cliente.', 'success');
    },
    onError: (error) => showToast(getAdvertiserErrorMessage(error), 'error'),
  });
  const { data: leadSources = [] } = useQuery({
    queryKey: queryKeys.leadSources.list({ active: true }),
    queryFn: () => listLeadSources(true),
  });

  useEffect(() => {
    if (advertiser) {
      setTradeName(advertiser.tradeName ?? '');
      setContactName(advertiser.contactName ?? '');
      setContactPhone(advertiser.contactPhone ?? '');
      setContactEmail(advertiser.contactEmail ?? '');
      setNotes(advertiser.notes ?? '');
      setStatus(advertiser.status ?? 'LEAD');
      setLeadSourceId(advertiser.leadSourceId ?? null);
    }
  }, [advertiser?.id]);

  useEffect(() => {
    if (isNew) setStatus(role === 'ADMIN' && requestedStatus === 'CLIENT' ? 'CLIENT' : 'LEAD');
  }, [isNew, requestedStatus, role]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (status === 'LEAD' && !leadSourceId) {
        throw new ApiError(400, 'Selecione a origem do Lead.');
      }
      return saveAdvertiser(isNew ? null : id, {
        tradeName: tradeName.trim(),
        contactName: contactName.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
        leadSourceId: status === 'LEAD' ? leadSourceId : null,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.advertisers.all });
      setIsDirty(false);
      showToast(isNew ? 'Cadastro criado!' : 'Cadastro atualizado!', 'success');
      if (isNew && selectOnReturn === 'true') {
        router.replace(`/proposal/new?selectedAdvertiserId=${data.id}`);
        return;
      }
      if (isNew) router.replace(`/advertiser/${data.id}`);
    },
    onError: (err) => showToast(err instanceof ApiError ? err.message : 'Erro ao salvar.', 'error'),
  });

  if (!isNew && isLoading) return <LoadingSpinner message="Carregando..." />;
  if (!isNew && isError) return <EmptyState icon="alert-circle" title="Não encontrado" description={getAdvertiserErrorMessage(advertiserError)} actionLabel="Voltar" onAction={() => router.back()} />;

  const title = isNew ? 'Novo' : (advertiser?.tradeName ?? 'Anunciante');
  const isLead = (advertiser?.status ?? status) === 'LEAD';

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: bottomPad + 40 }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      <View style={[styles.header, { paddingTop: topPad + spacing.md, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <NativeBackButton onPress={() => router.back()} />
        <UIHeader
          title={title}
          subtitle={isNew ? 'Cadastre um novo contato comercial.' : 'Dados comerciais e propostas vinculadas.'}
          style={styles.headerCenter}
          action={!isNew ? <UIChip label={isLead ? 'Lead' : 'Cliente'} active /> : undefined}
        />
        {isDirty && (
          <UIButton
            title="Salvar"
            size="sm"
            style={saveMutation.isPending && styles.disabled}
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : <Text style={styles.saveBtnText}>Salvar</Text>}
          </UIButton>
        )}
      </View>

      {isNew && role === 'ADMIN' && (
        <UICard variant="elevated" style={styles.statusSection}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TIPO</Text>
          <View style={styles.statusToggle}>
            {(['LEAD', 'CLIENT'] as AdvertiserStatus[]).map((s) => (
              <UIChip
                key={s}
                label={s === 'LEAD' ? 'Lead' : 'Cliente'}
                active={status === s}
                onPress={() => setStatus(s)}
                style={styles.statusBtn}
              />
            ))}
          </View>
        </UICard>
      )}

      <UICard variant="elevated" style={styles.form}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DADOS PRINCIPAIS</Text>
        <FormInput label="Nome / Razão Social" required leftIcon="briefcase" placeholder="Nome do anunciante" value={tradeName} onChangeText={(t) => { setTradeName(t); setIsDirty(true); }} />
        <FormInput label="Nome do Contato" leftIcon="user" placeholder="Responsável" value={contactName} onChangeText={(t) => { setContactName(t); setIsDirty(true); }} />
        {status === 'LEAD' && (
          <LeadSourcePicker
            sources={leadSources}
            value={leadSourceId}
            error={sourceError}
            onChange={(value) => {
              setLeadSourceId(value);
              setSourceError('');
              setIsDirty(true);
            }}
          />
        )}
      </UICard>

      {!isNew && (
        <UICard variant="elevated" style={styles.form}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PROPOSTAS VINCULADAS</Text>
          <AdvertiserProposalList proposals={advertiser?.proposals ?? []} />
        </UICard>
      )}

      {!isNew && advertiser && role === 'COMERCIAL' && (
        <UICard variant="elevated" style={styles.form}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AÇÕES COMERCIAIS</Text>
          {isLead && <UIButton title={promoteMutation.isPending ? 'Convertendo...' : 'Converter em cliente'} iconLeft="repeat" onPress={() => promoteMutation.mutate()} disabled={promoteMutation.isPending} />}
          <AdvertiserDeactivateAction advertiser={advertiser} deactivate={deactivateAdvertiser} onSuccess={() => { queryClient.invalidateQueries({ queryKey: queryKeys.advertisers.all }); showToast('Cadastro desativado.', 'success'); router.back(); }} />
        </UICard>
      )}

      <UICard variant="elevated" style={styles.form}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CONTATO</Text>
        <FormInput label="Telefone" leftIcon="phone" placeholder="(00) 00000-0000" keyboardType="phone-pad" value={contactPhone} onChangeText={(t) => { setContactPhone(t); setIsDirty(true); }} />
        <FormInput label="E-mail" leftIcon="mail" placeholder="contato@empresa.com" keyboardType="email-address" autoCapitalize="none" value={contactEmail} onChangeText={(t) => { setContactEmail(t); setIsDirty(true); }} />
      </UICard>

      <UICard variant="elevated" style={styles.form}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>OBSERVAÇÕES</Text>
        <FormInput label="Informação interna" leftIcon="file-text" placeholder="Anotações sobre o anunciante..." multiline numberOfLines={3} value={notes} onChangeText={(t) => { setNotes(t); setIsDirty(true); }} />
      </UICard>

      {isNew && (
        <View style={{ padding: 20 }}>
          <UIButton
            title="Criar cadastro"
            size="lg"
            variant={tradeName.trim() ? 'primary' : 'secondary'}
            style={[styles.createBtn, saveMutation.isPending && styles.disabled]}
            onPress={() => {
              if (status === 'LEAD' && !leadSourceId) {
                setSourceError('A origem e obrigatoria.');
                return;
              }
              if (tradeName.trim()) saveMutation.mutate();
            }}
            disabled={!tradeName.trim() || saveMutation.isPending}
          >
            {saveMutation.isPending ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.createBtnText}>Criar cadastro</Text>}
          </UIButton>
        </View>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, gap: spacing.sm },
  headerCenter: { flex: 1 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#FFF' },
  disabled: { opacity: 0.7 },
  statusSection: { margin: spacing.lg, gap: spacing.sm },
  statusToggle: { flexDirection: 'row', gap: spacing.sm },
  statusBtn: { flex: 1 },
  sectionLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  form: { marginHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.lg, borderRadius: tokens.radius.xl, ...shadows.sm },
  createBtn: { minHeight: 52 },
  createBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFF' },
});
