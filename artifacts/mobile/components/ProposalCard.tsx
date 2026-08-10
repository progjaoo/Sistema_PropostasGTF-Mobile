import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ProposalSummary } from '@/src/types';
import { StatusBadge } from './StatusBadge';
import { formatRelativeDate, formatCurrency, formatMonthYear } from '@/src/utils/format';
import { useColors } from '@/hooks/useColors';

interface Props {
  proposal: ProposalSummary;
  showOwner?: boolean;
}

export function ProposalCard({ proposal, showOwner = false }: Props) {
  const colors = useColors();
  const clientName = proposal.advertiserTradeName ?? proposal.advertiserName ?? proposal.clientLine1 ?? 'Sem cliente';
  const period = formatMonthYear(proposal.propMonth, proposal.propYear);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/proposal/${proposal.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.clientInfo}>
          <Text style={[styles.clientName, { color: colors.foreground }]} numberOfLines={1}>
            {clientName}
          </Text>
          <Text style={[styles.period, { color: colors.mutedForeground }]}>{period}</Text>
        </View>
        <StatusBadge status={proposal.status} size="sm" />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.meta}>
        {proposal.stationName && (
          <View style={styles.metaItem}>
            <Feather name="radio" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {proposal.stationName}
            </Text>
          </View>
        )}
        {proposal.proposalTypeName && (
          <View style={styles.metaItem}>
            <Feather name="tag" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {proposal.proposalTypeName}
            </Text>
          </View>
        )}
        {showOwner && proposal.createdByName && (
          <View style={styles.metaItem}>
            <Feather name="user" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {proposal.createdByName}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {proposal.investValue ? (
          <Text style={[styles.value, { color: colors.primary }]}>
            {formatCurrency(proposal.investValue)}
          </Text>
        ) : (
          <Text style={[styles.valuePlaceholder, { color: colors.mutedForeground }]}>Sem investimento</Text>
        )}
        <Text style={[styles.time, { color: colors.mutedForeground }]}>
          {formatRelativeDate(proposal.updatedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  clientInfo: {
    flex: 1,
    gap: 2,
  },
  clientName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  period: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    height: 1,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    maxWidth: 130,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  valuePlaceholder: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  time: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});
