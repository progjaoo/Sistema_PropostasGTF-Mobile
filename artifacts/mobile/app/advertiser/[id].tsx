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
import { getAdvertiser, listLeadSources, saveAdvertiser } from '@/src/features/advertisers/api';
import { queryKeys } from '@/src/api/queryKeys';

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

  const { data: advertiser, isLoading, isError } = useQuery({
    queryKey: queryKeys.advertisers.detail(id),
    queryFn: () => getAdvertiser(id),
    enabled: !isNew && !!id,
    staleTime: 30000,
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
  if (!isNew && isError) return <EmptyState icon="alert-circle" title="Não encontrado" actionLabel="Voltar" onAction={() => router.back()} />;

  const title = isNew ? 'Novo' : (advertiser?.tradeName ?? 'Anunciante');
  const isLead = (advertiser?.status ?? status) === 'LEAD';

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: bottomPad + 40 }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{title}</Text>
          {!isNew && (
            <View style={[styles.statusTag, { backgroundColor: isLead ? colors.warning + '20' : colors.success + '20' }]}>
              <Text style={[styles.statusTagText, { color: isLead ? colors.warning : colors.success }]}>
                {isLead ? 'Lead' : 'Cliente'}
              </Text>
            </View>
          )}
        </View>
        {isDirty && (
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }, saveMutation.isPending && styles.disabled]}
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Salvar</Text>}
          </TouchableOpacity>
        )}
      </View>

      {isNew && role === 'ADMIN' && (
        <View style={styles.statusSection}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TIPO</Text>
          <View style={styles.statusToggle}>
            {(['LEAD', 'CLIENT'] as AdvertiserStatus[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusBtn, { borderColor: colors.border }, status === s && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setStatus(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.statusBtnText, { color: status === s ? '#FFF' : colors.mutedForeground }]}>
                  {s === 'LEAD' ? 'Lead' : 'Cliente'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={[styles.form, { backgroundColor: colors.card, borderTopColor: colors.border, borderBottomColor: colors.border }]}>
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
      </View>

      {!isNew && (
        <View style={[styles.form, { backgroundColor: colors.card, borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PROPOSTAS VINCULADAS</Text>
          <AdvertiserProposalList proposals={advertiser?.proposals ?? []} />
        </View>
      )}

      <View style={[styles.form, { backgroundColor: colors.card, borderTopColor: colors.border, borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CONTATO</Text>
        <FormInput label="Telefone" leftIcon="phone" placeholder="(00) 00000-0000" keyboardType="phone-pad" value={contactPhone} onChangeText={(t) => { setContactPhone(t); setIsDirty(true); }} />
        <FormInput label="E-mail" leftIcon="mail" placeholder="contato@empresa.com" keyboardType="email-address" autoCapitalize="none" value={contactEmail} onChangeText={(t) => { setContactEmail(t); setIsDirty(true); }} />
      </View>

      <View style={[styles.form, { backgroundColor: colors.card, borderTopColor: colors.border, borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>OBSERVAÇÕES</Text>
        <FormInput label="Informação interna" leftIcon="file-text" placeholder="Anotações sobre o anunciante..." multiline numberOfLines={3} value={notes} onChangeText={(t) => { setNotes(t); setIsDirty(true); }} />
      </View>

      {isNew && (
        <View style={{ padding: 20 }}>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: tradeName.trim() ? colors.primary : colors.muted }, saveMutation.isPending && styles.disabled]}
            onPress={() => {
              if (status === 'LEAD' && !leadSourceId) {
                setSourceError('A origem e obrigatoria.');
                return;
              }
              if (tradeName.trim()) saveMutation.mutate();
            }}
            disabled={!tradeName.trim() || saveMutation.isPending}
            activeOpacity={0.8}
          >
            {saveMutation.isPending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.createBtnText}>Criar cadastro</Text>}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 10 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', flex: 1 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  statusTagText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#FFF' },
  disabled: { opacity: 0.7 },
  statusSection: { padding: 16, gap: 8 },
  statusToggle: { flexDirection: 'row', gap: 10 },
  statusBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  statusBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  sectionLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  form: { padding: 20, gap: 16, borderTopWidth: 1, borderBottomWidth: 1, marginTop: 12 },
  createBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  createBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFF' },
});
