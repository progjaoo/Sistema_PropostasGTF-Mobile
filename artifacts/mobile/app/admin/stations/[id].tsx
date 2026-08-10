import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { FormInput } from '@/components/FormInput';
import { ImagePickerField } from '@/components/ImagePickerField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/components/ToastProvider';
import { apiCall, ApiError } from '@/src/api/client';
import { Station, StationPresentationItem } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { StationPresentationEditor } from '@/src/features/admin/stations/StationPresentationEditor';
import { UIButton, UICard, UIHeader } from '@/src/ui';
import { spacing } from '@/src/theme';

export default function StationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [name, setName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#427EFF');
  const [slogan, setSlogan] = useState('');
  const [city, setCity] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(isNew);
  const [presentationItems, setPresentationItems] = useState<StationPresentationItem[]>([]);

  const { data: station, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['station', id],
    queryFn: () => apiCall<Station>('GET', `/stations/${id}`),
    enabled: !isNew && !!id,
    staleTime: 60000,
  });
  const presentationQuery = useQuery({
    queryKey: ['station-presentation', id],
    queryFn: () => apiCall<{ items: StationPresentationItem[] }>('GET', `/stations/${id}/presentation`),
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (station) {
      setName(station.name ?? '');
      setPrimaryColor(station.primaryColor ?? '#427EFF');
      setSlogan(station.slogan ?? '');
      setCity(station.city ?? '');
      setContactPhone(station.contactPhone ?? '');
      setContactEmail(station.contactEmail ?? '');
      setLogoBase64(station.logoBase64 ?? null);
    }
  }, [station?.id]);
  useEffect(() => {
    if (presentationQuery.data) setPresentationItems(presentationQuery.data.items);
  }, [presentationQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!/^#[0-9A-Fa-f]{6}$/.test(primaryColor.trim())) {
        throw new ApiError(400, 'Informe uma cor hexadecimal válida. Ex: #427EFF');
      }
      const body = {
        name: name.trim(),
        primaryColor,
        slogan: slogan.trim() || undefined,
        city: city.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        logoBase64,
      };
      if (isNew) return apiCall<Station>('POST', '/stations', body);
      return apiCall<Station>('PATCH', `/stations/${id}`, body);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      queryClient.invalidateQueries({ queryKey: ['stations-for-new'] });
      queryClient.invalidateQueries({ queryKey: ['station', data.id] });
      setIsDirty(false);
      showToast(isNew ? 'Empresa criada!' : 'Empresa atualizada!', 'success');
      if (isNew) router.replace(`/admin/stations/${data.id}`);
    },
    onError: (err) => showToast(err instanceof ApiError ? err.message : 'Erro ao salvar.', 'error'),
  });
  const presentationMutation = useMutation({
    mutationFn: () => apiCall('PUT', `/stations/${id}/presentation`, {
      items: presentationItems.map(({ highlight, description, order }) => ({ highlight, description, order })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['station-presentation', id] });
      showToast('Apresentacao atualizada.', 'success');
    },
    onError: () => showToast('Erro ao salvar apresentacao.', 'error'),
  });

  if (!isNew && isLoading) return <LoadingSpinner message="Carregando..." />;
  if (!isNew && isError) {
    const message = error instanceof ApiError && error.status === 403
      ? 'Você não possui permissão para acessar esta empresa.'
      : error instanceof ApiError && error.status === 404
        ? 'Empresa não encontrada.'
        : 'Erro ao carregar empresa.';
    return (
      <View style={[styles.centerState, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={34} color={colors.destructive} />
        <Text style={[styles.centerTitle, { color: colors.foreground }]}>{message}</Text>
        <UIButton title="Tentar novamente" onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: bottomPad + 40 }} keyboardShouldPersistTaps="handled" bottomOffset={20}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <UIButton variant="ghost" iconLeft="arrow-left" size="sm" onPress={() => router.back()} accessibilityLabel="Voltar" />
        <UIHeader
          title={isNew ? 'Nova Empresa' : station?.name ?? 'Empresa'}
          subtitle={isNew ? 'Cadastre uma nova emissora.' : 'Edite dados, marca e apresentação padrão.'}
          style={styles.headerCopy}
        />
        {isDirty && (
          <UIButton title={saveMutation.isPending ? 'Salvando' : 'Salvar'} size="sm" onPress={() => saveMutation.mutate()} disabled={saveMutation.isPending} />
        )}
      </View>

      <UICard variant="elevated" style={styles.form}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>IDENTIFICAÇÃO</Text>
        <ImagePickerField
          label="Logo da empresa"
          value={logoBase64}
          emptyText="Nenhuma logo cadastrada"
          pending={saveMutation.isPending}
          onChange={(value) => { setLogoBase64(value); setIsDirty(true); }}
          onError={(message) => showToast(message, 'warning')}
        />
        <FormInput label="Nome" required leftIcon="radio" value={name} onChangeText={(t) => { setName(t); setIsDirty(true); }} />
        <FormInput label="Slogan" leftIcon="type" placeholder="Slogan ou tagline" value={slogan} onChangeText={(t) => { setSlogan(t); setIsDirty(true); }} />
      </UICard>

      {!isNew && (
        <UICard variant="elevated" style={styles.form}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>APRESENTACAO PADRAO</Text>
          <StationPresentationEditor items={presentationItems} onChange={setPresentationItems} />
          <UIButton title={presentationMutation.isPending ? 'Salvando apresentacao' : 'Salvar apresentacao'} onPress={() => presentationMutation.mutate()} disabled={presentationMutation.isPending} />
        </UICard>
      )}

      <UICard variant="elevated" style={styles.form}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>COR DA PROPOSTA</Text>
        <View style={styles.colorRow}>
          <View style={[styles.colorPreview, { backgroundColor: primaryColor }]} />
          <FormInput
            style={{ flex: 1 }}
            placeholder="#427EFF"
            value={primaryColor}
            onChangeText={(t) => { setPrimaryColor(t.trim()); setIsDirty(true); }}
            leftIcon="droplet"
            autoCapitalize="none"
          />
        </View>
        <Text style={[styles.colorHint, { color: colors.mutedForeground }]}>Código hexadecimal. Ex: #427EFF</Text>
      </UICard>

      <UICard variant="elevated" style={styles.form}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LOCALIZAÇÃO</Text>
        <FormInput label="Cidade" leftIcon="map-pin" value={city} onChangeText={(t) => { setCity(t); setIsDirty(true); }} />
      </UICard>

      <UICard variant="elevated" style={styles.form}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CONTATO</Text>
        <FormInput label="Telefone" leftIcon="phone" keyboardType="phone-pad" value={contactPhone} onChangeText={(t) => { setContactPhone(t); setIsDirty(true); }} />
        <FormInput label="E-mail" leftIcon="mail" keyboardType="email-address" autoCapitalize="none" value={contactEmail} onChangeText={(t) => { setContactEmail(t); setIsDirty(true); }} />
      </UICard>

      {isNew && (
        <View style={{ padding: 20 }}>
          <UIButton title={saveMutation.isPending ? 'Criando empresa' : 'Criar empresa'} size="lg" onPress={() => saveMutation.mutate()} disabled={!name.trim() || saveMutation.isPending} />
        </View>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, gap: spacing.sm },
  headerCopy: { flex: 1 },
  form: { margin: spacing.md, marginBottom: 0, gap: spacing.lg },
  sectionLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  colorPreview: { width: 40, height: 40, borderRadius: 10 },
  colorHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: spacing.md },
  centerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', textAlign: 'center' },
});
