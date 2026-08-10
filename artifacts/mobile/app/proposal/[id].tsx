import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { showConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';
import { apiCall, ApiError } from '@/src/api/client';
import {
  ProductTemplate,
  Proposal,
  ProposalProduct,
  ProposalStatus,
  ProposalTimeline,
  ProposalTimelineStep,
  ProposalVersion,
  StatBlock,
} from '@/src/types';
import { PROPOSAL_STATUS_LABELS, TIMELINE_STEP_LABELS } from '@/src/utils/enums';
import { formatDate, formatDateTime, formatCurrency, formatMonthYear } from '@/src/utils/format';
import { useAuthStore } from '@/src/store/authStore';
import { useColors } from '@/hooks/useColors';
import {
  deleteProposal,
  duplicateProposal,
  getProposalVersionDetail,
  restoreProposalFromSnapshot,
} from '@/src/features/proposals/api';
import { useProposalPdf } from '@/src/features/proposals/print/useProposalPdf';
import { ProposalVersionSheet } from '@/src/features/proposals/versions/ProposalVersionSheet';
import { ProductCatalogSheet } from '@/src/features/proposals/products/ProductCatalogSheet';
import { ProposalProductForm } from '@/src/features/proposals/products/ProposalProductForm';
import { calculateInvestmentSuggestion } from '@/src/features/proposals/products/investmentSuggestion';
import {
  ProposalEditorStepper,
  type ProposalEditorStep,
} from '@/src/features/proposals/editor/ProposalEditorStepper';
import { UIButton, UIInput } from '@/src/ui';
import { shadows, spacing, tokens } from '@/src/theme';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
const PRODUCT_COLORS = ['BLUE', 'YELLOW', 'RED', 'GREEN', 'DARK'] as const;

function isProposalProductColor(value: string): value is (typeof PRODUCT_COLORS)[number] {
  return PRODUCT_COLORS.includes(value as (typeof PRODUCT_COLORS)[number]);
}

function isoToBrDate(value?: string | null) {
  if (!value) return '';
  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function maskBrDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
}

function brDateToIso(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) {
    return null;
  }
  return `${year}-${month}-${day}`;
}

export default function ProposalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [showTimeline, setShowTimeline] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [timelineNote, setTimelineNote] = useState('');
  const [investValue, setInvestValue] = useState('');
  const [investDesc, setInvestDesc] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [clientLine1, setClientLine1] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [periodDesc, setPeriodDesc] = useState('');
  const [showPeriod, setShowPeriod] = useState(true);
  const [stats, setStats] = useState<StatBlock[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProposalProduct | null>(null);
  const [editorStep, setEditorStep] = useState<ProposalEditorStep>('context');
  const [isDirty, setIsDirty] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<Partial<Proposal>>({});
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const saveGeneration = useRef(0);
  const { isGenerating, shareProposalPdf } = useProposalPdf();

  const { data: proposal, isLoading, isError, refetch } = useQuery({
    queryKey: ['proposal', id],
    queryFn: () => apiCall<Proposal>('GET', `/proposals/${id}`),
    staleTime: 10000,
    refetchOnWindowFocus: false,
    enabled: !!id,
  });

  const { data: timeline, refetch: refetchTimeline } = useQuery({
    queryKey: ['proposal-timeline', id],
    queryFn: () => apiCall<ProposalTimeline[]>('GET', `/proposals/${id}/timeline`),
    enabled: showTimeline && !!id,
    staleTime: 10000,
  });

  const { data: versions, refetch: refetchVersions, isFetching: versionsFetching } = useQuery({
    queryKey: ['proposal-versions', id],
    queryFn: () => apiCall<ProposalVersion[]>('GET', `/proposals/${id}/versions`),
    enabled: showVersions && !!id,
    staleTime: 10000,
  });
  const { data: selectedVersion, isFetching: selectedVersionFetching } = useQuery({
    queryKey: ['proposal-version-detail', id, selectedVersionId],
    queryFn: () => getProposalVersionDetail(id, selectedVersionId!),
    enabled: !!id && !!selectedVersionId,
    staleTime: 10000,
  });

  const { data: catalogProducts = [] } = useQuery({
    queryKey: ['product-templates', proposal?.stationId, 'active'],
    queryFn: () =>
      apiCall<ProductTemplate[]>(
        'GET',
        `/product-templates?stationId=${encodeURIComponent(proposal!.stationId)}&active=true`,
      ),
    enabled:
      !!proposal?.stationId &&
      (proposal.viewerCanEdit !== false || user?.role === 'ADMIN' || proposal.createdById === user?.id),
    staleTime: 30000,
  });

  useEffect(() => {
    if (proposal) {
      setInvestValue(proposal.investValue ?? '');
      setInvestDesc(proposal.investDesc ?? '');
      setContactName(proposal.contactName ?? proposal.createdBy?.name ?? '');
      setContactRole(proposal.contactRole ?? proposal.createdBy?.jobTitle ?? '');
      setContactPhone(proposal.contactPhone ?? proposal.createdBy?.contactPhone ?? '');
      setClientLine1(proposal.clientLine1 ?? '');
      setDateStart(isoToBrDate(proposal.dateStart));
      setDateEnd(isoToBrDate(proposal.dateEnd));
      setPeriodDesc(proposal.periodDesc ?? '');
      setShowPeriod(proposal.showPeriod);
      setStats(proposal.stats ?? []);
    }
  }, [proposal?.id]);

  const statusMutation = useMutation({
    mutationFn: (status: ProposalStatus) =>
      apiCall<Proposal>('PATCH', `/proposals/${id}/status`, { status }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['proposal', id], updated);
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['recall-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      showToast(`Proposta marcada como ${PROPOSAL_STATUS_LABELS[updated.status]}.`, 'success');
    },
    onError: (err) => showToast(err instanceof ApiError ? err.message : 'Erro ao atualizar status.', 'error'),
  });

  const timelineMutation = useMutation({
    mutationFn: (step: ProposalTimelineStep) =>
      apiCall('POST', `/proposals/${id}/timeline`, { step, note: timelineNote.trim() || undefined }),
    onSuccess: () => {
      setTimelineNote('');
      refetchTimeline();
      showToast('Andamento registrado.', 'success');
    },
    onError: () => showToast('Erro ao registrar andamento.', 'error'),
  });
  const duplicateMutation = useMutation({
    mutationFn: () => duplicateProposal(id),
    onSuccess: (copy) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      showToast('Proposta duplicada.', 'success');
      router.push(`/proposal/${copy.id}`);
    },
    onError: () => showToast('Nao foi possivel duplicar a proposta.', 'error'),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteProposal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['recall-reminders'] });
      showToast('Rascunho excluido.', 'success');
      router.back();
    },
    onError: (error) =>
      showToast(error instanceof ApiError ? error.message : 'Nao foi possivel excluir o rascunho.', 'error'),
  });
  const restoreVersionMutation = useMutation({
    mutationFn: () => restoreProposalFromSnapshot(id, selectedVersion?.snapshot),
    onSuccess: (updated) => {
      queryClient.setQueryData(['proposal', id], updated);
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposal-versions', id] });
      setSelectedVersionId(null);
      setShowVersions(false);
      showToast('Versao restaurada.', 'success');
    },
    onError: (error) =>
      showToast(error instanceof ApiError ? error.message : 'Nao foi possivel restaurar a versao.', 'error'),
  });

  const productsMutation = useMutation({
    mutationFn: (products: ProposalProduct[]) =>
      apiCall<Proposal>('PATCH', `/proposals/${id}`, {
        products: products.map((product, order) => ({
          productTemplateId: product.productTemplateId ?? null,
          order,
          qty: product.qty || '01',
          title: product.title,
          description: product.description ?? null,
          detail: product.detail ?? null,
          program: product.program ?? null,
          durationLabel: product.durationLabel ?? null,
          airTime: product.airTime ?? null,
          seasonality: product.seasonality ?? null,
          tags: product.tags ?? [],
          color: isProposalProductColor(product.color) ? product.color : 'BLUE',
        })),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['proposal', id], updated);
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      setEditingProduct(null);
      showToast('Produtos atualizados.', 'success');
    },
    onError: (error) =>
      showToast(error instanceof ApiError ? error.message : 'Erro ao atualizar produtos.', 'error'),
  });

  const scheduleAutosave = useCallback((data: Partial<Proposal>) => {
    pendingSave.current = { ...pendingSave.current, ...data };
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setSaveStatus('saving');
    saveTimeout.current = setTimeout(() => {
      const payload = pendingSave.current;
      pendingSave.current = {};
      const generation = ++saveGeneration.current;
      saveQueue.current = saveQueue.current.then(async () => {
        try {
          await queryClient.cancelQueries({ queryKey: ['proposal', id] });
          const updated = await apiCall<Proposal>('PATCH', `/proposals/${id}`, payload);
          if (generation === saveGeneration.current) {
            queryClient.setQueryData(['proposal', id], updated);
          }
          if (Object.keys(pendingSave.current).length === 0) {
            setSaveStatus('saved');
            setIsDirty(false);
            setTimeout(() => setSaveStatus('idle'), 2000);
          }
        } catch {
          pendingSave.current = { ...payload, ...pendingSave.current };
          setSaveStatus('error');
          showToast('Falha ao salvar.', 'error');
        }
      });
    }, 800);
  }, [id, queryClient, showToast]);

  const handleInvestChange = (val: string) => {
    setInvestValue(val);
    setIsDirty(true);
    scheduleAutosave({ investValue: val });
  };

  const handleClientLine1Change = (val: string) => {
    setClientLine1(val);
    setIsDirty(true);
    scheduleAutosave({ clientLine1: val });
  };

  const handleDateChange = (field: 'dateStart' | 'dateEnd', value: string) => {
    const masked = maskBrDate(value);
    if (field === 'dateStart') setDateStart(masked);
    if (field === 'dateEnd') setDateEnd(masked);
    setIsDirty(true);
    if (!masked) scheduleAutosave({ [field]: null });
    const iso = brDateToIso(masked);
    if (iso) scheduleAutosave({ [field]: iso });
  };

  const validateDate = (value: string) => {
    if (value && !brDateToIso(value)) {
      showToast('Informe uma data valida no formato DD/MM/AAAA.', 'warning');
    }
  };

  const handleStatChange = (index: number, field: keyof StatBlock, value: string) => {
    const next = stats.map((stat, statIndex) => (statIndex === index ? { ...stat, [field]: value } : stat));
    setStats(next);
    setIsDirty(true);
    scheduleAutosave({ stats: next });
  };

  const addStat = () => {
    if (stats.length >= 4) {
      showToast('Limite de 4 itens de apresentacao.', 'warning');
      return;
    }
    const next = [...stats, { num: '', suf: '', desc: '' }];
    setStats(next);
    setIsDirty(true);
    scheduleAutosave({ stats: next });
  };

  const removeStat = (index: number) => {
    const next = stats.filter((_, statIndex) => statIndex !== index);
    setStats(next);
    setIsDirty(true);
    scheduleAutosave({ stats: next });
  };

  const handleStatusChange = (status: ProposalStatus) => {
    const statusLabel = PROPOSAL_STATUS_LABELS[status];
    const isDestructive = status === 'REJECTED';
    showConfirm({
      title: `Marcar como ${statusLabel}`,
      message: status === 'APPROVED'
        ? 'Ao aceitar, o Lead será promovido para Cliente e avisos de recaptura serão cancelados.'
        : status === 'REJECTED'
        ? 'Ao rejeitar, serão gerados avisos de recaptura aos 3, 6 e 10 meses.'
        : `Confirmar mudança para "${statusLabel}"?`,
      confirmText: statusLabel,
      destructive: isDestructive,
      onConfirm: () => statusMutation.mutate(status),
    });
  };

  const canEdit = proposal?.viewerCanEdit !== false || user?.role === 'ADMIN' || proposal?.createdById === user?.id;

  if (isLoading) return <LoadingSpinner message="Carregando proposta..." />;
  if (isError || !proposal) return <EmptyState icon="alert-circle" title="Proposta não encontrada" description="Esta proposta não existe ou foi removida." actionLabel="Voltar" onAction={() => router.back()} />;

  const period = formatMonthYear(proposal.propMonth, proposal.propYear);
  const clientName = proposal.advertiser?.tradeName ?? proposal.clientLine1 ?? 'Sem cliente';
  const suggestedInvestment = calculateInvestmentSuggestion(proposal.products ?? []);

  const addCatalogProduct = (template: ProductTemplate) => {
    const product: ProposalProduct = {
      id: `new-${Date.now()}`,
      order: proposal.products.length,
      qty: template.qty || '01',
      title: template.title,
      description: template.description ?? null,
      detail: template.detail ?? null,
      program: template.programName ?? template.program ?? null,
      tags: template.tags ?? [],
      color: 'BLUE',
      productTemplateId: template.id,
      durationId: template.durationId ?? null,
      durationLabel: template.durationLabel ?? null,
      airTime: null,
      seasonality: null,
      suggestedValueMin: template.suggestedValueMin ?? template.suggestedValue ?? null,
      suggestedValueMax: template.suggestedValueMax ?? null,
    };
    setCatalogOpen(false);
    setEditingProduct(product);
  };

  const createCustomProduct = () => {
    setCatalogOpen(false);
    setEditingProduct({
      id: `new-${Date.now()}`,
      order: proposal.products.length,
      qty: '01',
      title: '',
      description: null,
      detail: null,
      program: null,
      tags: [],
      color: 'BLUE',
      productTemplateId: null,
      durationId: null,
      durationLabel: null,
      airTime: null,
      seasonality: null,
    });
  };

  const saveProduct = (product: ProposalProduct) => {
    if (productsMutation.isPending) return;
    if (!product.title.trim()) {
      showToast('Informe o nome do produto.', 'warning');
      return;
    }
    const exists = proposal.products.some((current) => current.id === product.id);
    const products = exists
      ? proposal.products.map((current) => (current.id === product.id ? product : current))
      : [...proposal.products, product];
    productsMutation.mutate(products);
  };

  const removeProduct = (product: ProposalProduct) => {
    if (productsMutation.isPending) return;
    showConfirm({
      title: 'Excluir produto?',
      message: `${product.title} será removido desta proposta.`,
      confirmText: 'Excluir',
      destructive: true,
      onConfirm: () =>
        productsMutation.mutate(proposal.products.filter((current) => current.id !== product.id)),
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{clientName}</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>{period}</Text>
        </View>
        <View style={styles.saveIndicator}>
          {saveStatus === 'saving' && <ActivityIndicator size="small" color={colors.primary} />}
          {saveStatus === 'saved' && <Feather name="check" size={18} color={colors.success} />}
          {saveStatus === 'error' && <Feather name="alert-circle" size={18} color={colors.danger} />}
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 120 }]}>
        {canEdit && <ProposalEditorStepper value={editorStep} onChange={setEditorStep} />}
        {/* Status */}
        {(editorStep === 'context' || !canEdit) && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Status</Text>
            <StatusBadge status={proposal.status} />
          </View>
          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Empresa</Text>
            <Text style={[styles.cardValue, { color: colors.foreground }]}>{proposal.station?.name ?? proposal.stationId}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Tipo</Text>
            <Text style={[styles.cardValue, { color: colors.foreground }]}>{proposal.propType}</Text>
          </View>
          {proposal.createdBy?.name && (
            <View style={styles.cardRow}>
              <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Responsável</Text>
              <Text style={[styles.cardValue, { color: colors.foreground }]}>{proposal.createdBy.name}</Text>
            </View>
          )}
          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Atualizado</Text>
            <Text style={[styles.cardValue, { color: colors.foreground }]}>{formatDateTime(proposal.updatedAt)}</Text>
          </View>
          </View>
        )}

        {/* Investment */}
        {canEdit && editorStep === 'investment' && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>INVESTIMENTO</Text>
            <UIInput
              placeholder="Ex: 5000.00"
              value={investValue}
              onChangeText={handleInvestChange}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.investHint, { color: colors.mutedForeground }]}>
              Valor final em reais. Salvo automaticamente.
            </Text>
            <UIInput
              containerStyle={styles.timelineNoteInput}
              style={styles.multilineInput}
              placeholder="Descricao do investimento"
              value={investDesc}
              multiline
              onChangeText={(value) => {
                setInvestDesc(value);
                setIsDirty(true);
                scheduleAutosave({ investDesc: value || null });
              }}
            />
            {suggestedInvestment > 0 && (
              <View style={[styles.suggestion, { backgroundColor: colors.primary + '10' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.suggestionLabel, { color: colors.mutedForeground }]}>Sugestão pelo catálogo</Text>
                  <Text style={[styles.suggestionValue, { color: colors.foreground }]}>
                    {formatCurrency(String(suggestedInvestment))}
                  </Text>
                </View>
                <UIButton
                  title="Usar valor"
                  variant="outline"
                  size="sm"
                  style={styles.suggestionButton}
                  onPress={() => handleInvestChange(suggestedInvestment.toFixed(2))}
                />
              </View>
            )}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>CONTATO NA PROPOSTA</Text>
            <UIInput
              placeholder="Nome do contato"
              value={contactName}
              onChangeText={(value) => {
                setContactName(value);
                setIsDirty(true);
                scheduleAutosave({ contactName: value || null });
              }}
            />
            <UIInput
              placeholder="Cargo ou funcao"
              value={contactRole}
              onChangeText={(value) => {
                setContactRole(value);
                setIsDirty(true);
                scheduleAutosave({ contactRole: value || null });
              }}
            />
            <UIInput
              placeholder="Telefone de contato"
              value={contactPhone}
              keyboardType="phone-pad"
              onChangeText={(value) => {
                setContactPhone(value);
                setIsDirty(true);
                scheduleAutosave({ contactPhone: value || null });
              }}
            />
          </View>
        )}

        {canEdit && editorStep === 'period' && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardRow}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PERIODO</Text>
              <TouchableOpacity
                accessibilityRole="switch"
                accessibilityState={{ checked: showPeriod }}
                style={[styles.switch, { backgroundColor: showPeriod ? colors.primary : colors.muted }]}
                onPress={() => {
                  const next = !showPeriod;
                  setShowPeriod(next);
                  scheduleAutosave({ showPeriod: next });
                }}
              >
                <View style={[styles.switchKnob, { alignSelf: showPeriod ? 'flex-end' : 'flex-start' }]} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.investHint, { color: colors.mutedForeground }]}>
              {showPeriod ? 'O periodo sera exibido no PDF.' : 'O periodo nao sera exibido no PDF.'}
            </Text>
            {showPeriod && (
              <View style={styles.dateRow}>
                <UIInput
                  containerStyle={styles.dateInput}
                  placeholder="Inicio (DD/MM/AAAA)"
                  value={dateStart}
                  keyboardType="number-pad"
                  onChangeText={(value) => handleDateChange('dateStart', value)}
                  onEndEditing={() => validateDate(dateStart)}
                />
                <UIInput
                  containerStyle={styles.dateInput}
                  placeholder="Fim (DD/MM/AAAA)"
                  value={dateEnd}
                  keyboardType="number-pad"
                  onChangeText={(value) => handleDateChange('dateEnd', value)}
                  onEndEditing={() => validateDate(dateEnd)}
                />
              </View>
            )}
            {showPeriod && (
              <UIInput
                containerStyle={styles.timelineNoteInput}
                style={styles.multilineInput}
                placeholder="Nota do periodo, ex: veiculacao de segunda a sexta"
                value={periodDesc}
                multiline
                onChangeText={(value) => {
                  setPeriodDesc(value);
                  setIsDirty(true);
                  scheduleAutosave({ periodDesc: value || null });
                }}
              />
            )}
          </View>
        )}

        {/* Client line */}
        {canEdit && editorStep === 'context' && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>CLIENTE / ANUNCIANTE</Text>
            <UIInput
              placeholder="Nome do cliente na proposta"
              value={clientLine1}
              onChangeText={handleClientLine1Change}
            />
            {proposal.advertiser && (
              <Text style={[styles.investHint, { color: colors.success }]}>
                Vinculado: {proposal.advertiser.tradeName}
              </Text>
            )}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.productsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>APRESENTACAO</Text>
              <TouchableOpacity style={[styles.addProductButton, { borderColor: colors.primary }]} onPress={addStat}>
                <Feather name="plus" size={15} color={colors.primary} />
                <Text style={[styles.addProductText, { color: colors.primary }]}>Item</Text>
              </TouchableOpacity>
            </View>
            {stats.length === 0 && (
              <Text style={[styles.investHint, { color: colors.mutedForeground }]}>
                Adicione ate 4 indicadores para aparecerem na proposta.
              </Text>
            )}
            {stats.map((stat, index) => (
              <View key={index} style={[styles.statEditor, { borderColor: colors.border }]}>
                <View style={styles.statInputs}>
                  <View style={styles.statNumberRow}>
                    <TextInput
                      style={[styles.statNumberInput, { color: colors.foreground, borderColor: colors.border }]}
                      placeholder="Numero"
                      placeholderTextColor={colors.mutedForeground}
                      value={stat.num}
                      onChangeText={(value) => handleStatChange(index, 'num', value)}
                    />
                    <TextInput
                      style={[styles.statSufInput, { color: colors.foreground, borderColor: colors.border }]}
                      placeholder="Sufixo"
                      placeholderTextColor={colors.mutedForeground}
                      value={stat.suf ?? ''}
                      onChangeText={(value) => handleStatChange(index, 'suf', value)}
                    />
                  </View>
                  <TextInput
                    style={[styles.statDescInput, { color: colors.foreground, borderColor: colors.border }]}
                    placeholder="Descricao"
                    placeholderTextColor={colors.mutedForeground}
                    value={stat.desc}
                    onChangeText={(value) => handleStatChange(index, 'desc', value)}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.productIconButton, { backgroundColor: colors.danger, borderColor: colors.danger }]}
                  onPress={() => removeStat(index)}
                >
                  <Feather name="trash-2" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Products */}
        {(editorStep === 'products' || !canEdit) && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.productsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PRODUTOS ({proposal.products.length})</Text>
              {canEdit && (
                <TouchableOpacity
                  style={[styles.addProductButton, { borderColor: colors.primary }]}
                  onPress={() => setCatalogOpen(true)}
                  disabled={productsMutation.isPending}
                >
                  <Feather name="plus" size={15} color={colors.primary} />
                  <Text style={[styles.addProductText, { color: colors.primary }]}>Adicionar</Text>
                </TouchableOpacity>
              )}
            </View>
            {proposal.products.length === 0 && (
              <Text style={[styles.emptyProducts, { color: colors.mutedForeground }]}>
                Nenhum produto adicionado.
              </Text>
            )}
            {proposal.products.map((p, idx) => (
              <View key={p.id} style={[styles.productRow, idx < proposal.products.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={styles.productInfo}>
                  <Text style={[styles.productTitle, { color: colors.foreground }]}>{p.title}</Text>
                  {p.qty && <Text style={[styles.productQty, { color: colors.mutedForeground }]}>Qtd: {p.qty}</Text>}
                  {!![p.durationLabel, p.airTime, p.seasonality].filter(Boolean).length && (
                    <Text style={[styles.productQty, { color: colors.mutedForeground }]}>
                      {[p.durationLabel, p.airTime, p.seasonality].filter(Boolean).join(' - ')}
                    </Text>
                  )}
                  {p.program && <Text style={[styles.productProg, { color: colors.mutedForeground }]}>{p.program}</Text>}
                </View>
                {canEdit && (
                  <View style={styles.productActions}>
                    <TouchableOpacity
                      accessibilityLabel={`Editar ${p.title}`}
                      style={[styles.productIconButton, { borderColor: colors.border }]}
                      onPress={() => setEditingProduct(p)}
                      disabled={productsMutation.isPending}
                    >
                      <Feather name="edit-2" size={16} color={colors.foreground} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityLabel={`Excluir ${p.title}`}
                      style={[styles.productIconButton, { backgroundColor: colors.danger, borderColor: colors.danger }]}
                      onPress={() => removeProduct(p)}
                      disabled={productsMutation.isPending}
                    >
                      <Feather name="trash-2" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Timeline */}
        {(editorStep === 'review' || !canEdit) && (
          <>
        <TouchableOpacity
          style={[styles.timelineToggle, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => { setShowTimeline((v) => !v); if (!showTimeline) refetchTimeline(); }}
          activeOpacity={0.7}
        >
          <Feather name="activity" size={16} color={colors.primary} />
          <Text style={[styles.timelineToggleText, { color: colors.primary }]}>
            {showTimeline ? 'Ocultar andamento' : 'Ver andamento'}
          </Text>
          <Feather name={showTimeline ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.timelineToggle, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => { setShowVersions((v) => !v); if (!showVersions) refetchVersions(); }}
          activeOpacity={0.7}
        >
          <Feather name="clock" size={16} color={colors.primary} />
          <Text style={[styles.timelineToggleText, { color: colors.primary }]}>
            {showVersions ? 'Ocultar versoes' : 'Ver historico de versoes'}
          </Text>
          <Feather name={showVersions ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
        </TouchableOpacity>

        {showVersions && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>VERSOES DA PROPOSTA</Text>
            {versionsFetching && <ActivityIndicator color={colors.primary} />}
            {!versionsFetching && !(versions ?? []).length && (
              <Text style={[styles.emptyProducts, { color: colors.mutedForeground }]}>Nenhuma versao registrada.</Text>
            )}
            {(versions ?? []).map((version, index) => (
              <TouchableOpacity
                key={version.id}
                style={[styles.versionRow, index < (versions?.length ?? 0) - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                onPress={() => setSelectedVersionId(version.id)}
              >
                <View style={[styles.versionIcon, { backgroundColor: colors.accent }]}>
                  <Feather name="file-text" size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timelineStep, { color: colors.foreground }]}>Versao registrada</Text>
                  <Text style={[styles.timelineDate, { color: colors.mutedForeground }]}>{formatDateTime(version.createdAt)}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showTimeline && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ANDAMENTO</Text>
            {(timeline ?? []).map((t, idx) => (
              <View key={t.id} style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineStep, { color: colors.foreground }]}>
                    {TIMELINE_STEP_LABELS[t.step] ?? t.step}
                  </Text>
                  {t.note && <Text style={[styles.timelineNote, { color: colors.mutedForeground }]}>{t.note}</Text>}
                  <Text style={[styles.timelineDate, { color: colors.mutedForeground }]}>{formatDateTime(t.createdAt)}</Text>
                </View>
              </View>
            ))}
            {canEdit && (
              <View style={styles.addTimeline}>
                <UIInput
                  containerStyle={styles.timelineNoteInput}
                  style={styles.multilineInput}
                  placeholder="Nota opcional..."
                  value={timelineNote}
                  onChangeText={setTimelineNote}
                  multiline
                />
                <View style={styles.timelineActions}>
                  {(['IN_CONVERSATION', 'PROPOSAL_SENT', 'CLIENT_REVIEWING', 'NEGOTIATION'] as ProposalTimelineStep[]).map((step) => (
                    <TouchableOpacity
                      key={step}
                      style={[styles.timelineStepButton, { borderColor: colors.primary }]}
                      onPress={() => timelineMutation.mutate(step)}
                      disabled={timelineMutation.isPending}
                    >
                      <Text style={[styles.timelineStepButtonText, { color: colors.primary }]}>{TIMELINE_STEP_LABELS[step]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
        <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.previewHero, { backgroundColor: proposal.station?.primaryColor ?? colors.primary }]}>
            <Text style={styles.previewType}>{proposal.propType}</Text>
            <Text style={styles.previewClient} numberOfLines={2}>{clientName.toUpperCase()}</Text>
            {proposal.showPeriod && <Text style={styles.previewPeriod}>{dateStart || proposal.propMonth || 'Periodo mensal'}</Text>}
          </View>
          <View style={styles.previewSummary}>
            <Text style={[styles.previewSummaryText, { color: colors.foreground }]}>
              {proposal.products.length} produto(s) · {formatCurrency(proposal.investValue ?? '0')}
            </Text>
            <Text style={[styles.investHint, { color: colors.mutedForeground }]}>
              Esta prévia resume o conteúdo que será usado no PDF compartilhado.
            </Text>
          </View>
        </View>
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>DOCUMENTO</Text>
          <UIButton
            variant="primary"
            iconLeft="share-2"
            title={isGenerating ? 'Gerando PDF...' : 'Gerar e compartilhar PDF'}
            style={styles.actionBtn}
            disabled={isGenerating}
            onPress={() => shareProposalPdf(proposal).catch(() => showToast('Erro ao gerar PDF.', 'error'))}
          />
          {canEdit && (
            <UIButton
              variant="outline"
              iconLeft="copy"
              title="Duplicar proposta"
              style={styles.actionBtn}
              disabled={duplicateMutation.isPending}
              onPress={() => duplicateMutation.mutate()}
            />
          )}
        </View>

        {/* Actions */}
        {canEdit && proposal.status !== 'APPROVED' && (
          <View style={styles.actionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>AÇÕES</Text>
            <View style={styles.actionButtons}>
              {proposal.status !== 'SENT' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.info + '15', borderColor: colors.info + '40' }]}
                  onPress={() => handleStatusChange('SENT')}
                  activeOpacity={0.7}
                >
                  <Feather name="send" size={16} color={colors.info} />
                  <Text style={[styles.actionBtnText, { color: colors.info }]}>Marcar Enviada</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.success + '15', borderColor: colors.success + '40' }]}
                onPress={() => handleStatusChange('APPROVED')}
                activeOpacity={0.7}
              >
                <Feather name="check-circle" size={16} color={colors.success} />
                <Text style={[styles.actionBtnText, { color: colors.success }]}>Aceitar</Text>
              </TouchableOpacity>
              {proposal.status !== 'REJECTED' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '40' }]}
                  onPress={() => handleStatusChange('REJECTED')}
                  activeOpacity={0.7}
                >
                  <Feather name="x-circle" size={16} color={colors.danger} />
                  <Text style={[styles.actionBtnText, { color: colors.danger }]}>Rejeitar</Text>
                </TouchableOpacity>
              )}
              {proposal.status === 'DRAFT' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.danger, borderColor: colors.danger }]}
                  onPress={() => showConfirm({
                    title: 'Excluir rascunho?',
                    message: 'Esta proposta sera cancelada e removida do fluxo de rascunhos.',
                    confirmText: 'Excluir',
                    destructive: true,
                    onConfirm: () => deleteMutation.mutate(),
                  })}
                  activeOpacity={0.7}
                  disabled={deleteMutation.isPending}
                >
                  <Feather name="trash-2" size={16} color="#FFF" />
                  <Text style={[styles.actionBtnText, { color: '#FFF' }]}>
                    {deleteMutation.isPending ? 'Excluindo...' : 'Excluir Rascunho'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
          </>
        )}
      </ScrollView>
      <ProductCatalogSheet
        visible={catalogOpen}
        products={catalogProducts}
        onClose={() => setCatalogOpen(false)}
        onSelect={addCatalogProduct}
        onCreateCustom={createCustomProduct}
      />
      <ProposalProductForm
        visible={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSave={saveProduct}
        pending={productsMutation.isPending}
      />
      <ProposalVersionSheet
        visible={!!selectedVersionId}
        version={selectedVersion ?? null}
        loading={selectedVersionFetching}
        restoring={restoreVersionMutation.isPending}
        onClose={() => setSelectedVersionId(null)}
        onRestore={() => restoreVersionMutation.mutate()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 10 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  saveIndicator: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: tokens.radius.xl, borderWidth: 1, padding: spacing.lg, gap: spacing.md, ...shadows.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', width: 100 },
  cardValue: { fontSize: 14, fontFamily: 'Inter_500Medium', flex: 1, textAlign: 'right' },
  sectionTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, marginBottom: 2 },
  investInput: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 15, fontFamily: 'Inter_400Regular' },
  investHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  divider: { height: 1, marginVertical: 4 },
  switch: { width: 48, height: 28, borderRadius: 99, padding: 3, justifyContent: 'center' },
  switchKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF' },
  dateRow: { gap: 8 },
  dateInput: { flex: 1 },
  suggestion: { padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  suggestionLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  suggestionValue: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 2 },
  suggestionButton: { minHeight: 42 },
  productsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  addProductButton: { minHeight: 40, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  addProductText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  emptyProducts: { paddingVertical: 12, fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  productRow: { paddingVertical: 10, gap: 10, flexDirection: 'row', alignItems: 'center' },
  productInfo: { gap: 2, flex: 1 },
  productActions: { flexDirection: 'row', gap: 8 },
  productIconButton: { width: 42, height: 42, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  productTitle: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  productQty: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  productProg: { fontSize: 12, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
  statEditor: { borderWidth: 1, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statInputs: { flex: 1, gap: 8 },
  statNumberRow: { flexDirection: 'row', gap: 8 },
  statNumberInput: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, fontFamily: 'Inter_700Bold' },
  statSufInput: { width: 96, minHeight: 42, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, fontFamily: 'Inter_600SemiBold' },
  statDescInput: { minHeight: 42, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, fontFamily: 'Inter_400Regular' },
  timelineToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, justifyContent: 'center' },
  timelineToggleText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', flex: 1, textAlign: 'center' },
  timelineItem: { flexDirection: 'row', gap: 12, paddingVertical: 6 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  timelineContent: { flex: 1, gap: 2 },
  timelineStep: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  timelineNote: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  timelineDate: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  addTimeline: { gap: 8, marginTop: 8 },
  timelineNoteInput: { minHeight: 72 },
  multilineInput: { minHeight: 68, paddingTop: 12, textAlignVertical: 'top' },
  addTimelineBtn: { padding: 10, borderRadius: 8, alignItems: 'center' },
  addTimelineBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#FFF' },
  timelineActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timelineStepButton: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  timelineStepButtonText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  versionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  versionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  previewCard: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  previewHero: { padding: 18, gap: 8 },
  previewType: { color: '#FFF', opacity: 0.78, fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 2, textTransform: 'uppercase' },
  previewClient: { color: '#FFF', fontSize: 26, lineHeight: 30, fontFamily: 'Inter_700Bold' },
  previewPeriod: { color: '#FFF', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  previewSummary: { padding: 14, gap: 4 },
  previewSummaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  actionsSection: { gap: 10 },
  actionButtons: { gap: 8 },
  actionBtn: { minHeight: 50 },
  actionBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
