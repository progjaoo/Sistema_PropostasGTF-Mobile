import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ProgramBoardProposal, ProposalProgramBoard, ProposalProgramBoardProgram } from '@/src/api/contracts';
import { useColors } from '@/hooks/useColors';
import { formatCurrency, formatDateTime } from '@/src/utils/format';
import { PROPOSAL_STATUS_LABELS } from '@/src/utils/enums';
import { UIBadge, UICard, UIChip, UIEmptyState } from '@/src/ui';
import { spacing } from '@/src/theme';

interface Props {
  board: ProposalProgramBoard;
  refreshing: boolean;
  onRefresh: () => void;
}

export function ProposalProgramBoardView({ board, refreshing, onRefresh }: Props) {
  const colors = useColors();
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const programs = board.programs;
  const selectedProgram = useMemo(() => {
    if (!programs.length) return null;
    return programs.find((program) => program.id === selectedProgramId) ?? programs[0];
  }, [programs, selectedProgramId]);

  return (
    <FlatList
      data={selectedProgram?.proposals ?? []}
      keyExtractor={(proposal) => proposal.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.headerArea}>
          <FlatList
            horizontal
            data={programs}
            keyExtractor={(program) => program.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.programs}
            renderItem={({ item }) => (
              <ProgramChip
                program={item}
                selected={(selectedProgram?.id ?? programs[0]?.id) === item.id}
                onPress={() => setSelectedProgramId(item.id)}
              />
            )}
            ListEmptyComponent={
              <UIEmptyState icon="grid" title="Sem programas" description="Nenhum programa encontrado." style={styles.emptyState} />
            }
          />
          {selectedProgram && <ProgramSummary program={selectedProgram} />}
        </View>
      }
      renderItem={({ item }) => <ProgramProposalCard proposal={item} />}
      ListEmptyComponent={
        <UIEmptyState
          icon="file-text"
          title="Sem propostas"
          description="Nenhuma proposta vinculada a este programa."
          style={styles.emptyState}
        />
      }
    />
  );
}

function ProgramChip({
  program,
  selected,
  onPress,
}: {
  program: ProposalProgramBoardProgram;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <UICard
      variant={selected ? 'muted' : 'default'}
      style={[
        styles.programChip,
        { borderColor: selected ? (program.primaryColor ?? colors.primary) : colors.border },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View style={[styles.programDot, { backgroundColor: program.primaryColor ?? colors.primary }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.programName, { color: colors.foreground }]} numberOfLines={1}>
          {program.name}
        </Text>
        <Text style={[styles.programMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
          {program.stationName ?? 'Sem empresa'} · {program.proposals.length} proposta(s)
        </Text>
      </View>
    </UICard>
  );
}

function ProgramSummary({ program }: { program: ProposalProgramBoardProgram }) {
  const colors = useColors();
  const total = program.proposals.reduce((sum, proposal) => sum + parseMoney(proposal.investValue), 0);
  return (
    <UICard variant="elevated" style={styles.summary}>
      <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>PROGRAMA SELECIONADO</Text>
      <Text style={[styles.summaryTitle, { color: colors.foreground }]}>{program.name}</Text>
      {!!program.description && <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>{program.description}</Text>}
      <View style={styles.summaryMetrics}>
        <Metric label="Propostas" value={String(program.proposals.length)} />
        <Metric label="Investimento" value={formatCurrency(total)} />
        <Metric label="Produtos" value={String(program.products.length)} />
      </View>
    </UICard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <UICard variant="muted" style={styles.metric}>
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </UICard>
  );
}

function ProgramProposalCard({ proposal }: { proposal: ProgramBoardProposal }) {
  const colors = useColors();
  return (
    <UICard
      variant="elevated"
      style={styles.proposalCard}
      onPress={() => router.push(`/proposal/${proposal.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir proposta de ${proposal.advertiserName ?? 'cliente sem nome'}`}
    >
      <View style={styles.proposalHead}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.proposalTitle, { color: colors.foreground }]} numberOfLines={1}>
            {proposal.advertiserName ?? 'Sem cliente'}
          </Text>
          <Text style={[styles.proposalMeta, { color: colors.mutedForeground }]} numberOfLines={2}>
            {proposal.proposalTypeName} · {proposal.stationName ?? 'Sem empresa'} · {proposal.createdByName}
          </Text>
        </View>
        <UIBadge label={PROPOSAL_STATUS_LABELS[proposal.status]} variant={getStatusVariant(proposal.status)} size="sm" />
      </View>
      <View style={styles.proposalFooter}>
        <Text style={[styles.proposalValue, { color: colors.foreground }]}>
          {proposal.investValue ? formatCurrency(proposal.investValue) : 'Sem valor'}
        </Text>
        <Text style={[styles.proposalDate, { color: colors.mutedForeground }]}>{formatDateTime(proposal.updatedAt)}</Text>
      </View>
      <View style={styles.products}>
        {proposal.products.slice(0, 4).map((product) => (
          <UIChip key={product.id} label={`${product.qty}x ${product.title}`} style={styles.productPill} />
        ))}
        {proposal.products.length > 4 && (
          <UIBadge label={`+${proposal.products.length - 4}`} variant="default" size="sm" />
        )}
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} style={styles.chevron} />
    </UICard>
  );
}

function parseMoney(value: string | null | undefined) {
  if (!value) return 0;
  const clean = value.replace(/[^\d,.-]/g, '');
  const normalized = clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getStatusVariant(status: ProgramBoardProposal['status']) {
  if (status === 'DRAFT') return 'draft';
  if (status === 'SENT') return 'sent';
  if (status === 'APPROVED') return 'approved';
  if (status === 'REJECTED') return 'rejected';
  return 'archived';
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: spacing.md, paddingBottom: 120 },
  headerArea: { gap: 12 },
  programs: { gap: 10 },
  programChip: { width: 250, minHeight: 76, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 10 },
  programDot: { width: 12, height: 42, borderRadius: 999 },
  programName: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  programMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  summary: { gap: 8 },
  summaryLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.8 },
  summaryTitle: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  summaryText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  summaryMetrics: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, padding: 10, gap: 2 },
  metricValue: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  metricLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  proposalCard: { gap: 12 },
  proposalHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  proposalTitle: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  proposalMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 3 },
  proposalFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  proposalValue: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  proposalDate: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  products: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  productPill: { maxWidth: 220 },
  chevron: { position: 'absolute', right: 10, bottom: 10 },
  emptyState: { flex: 0, paddingVertical: 40 },
});
