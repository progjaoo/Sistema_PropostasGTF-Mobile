import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { AdvertiserLinkedProposal } from '@/src/api/contracts';
import { PROPOSAL_STATUS_LABELS } from '@/src/utils/enums';
import { useColors } from '@/hooks/useColors';

export function AdvertiserProposalList({ proposals }: { proposals: AdvertiserLinkedProposal[] }) {
  const colors = useColors();

  if (!proposals.length) {
    return <Text style={[styles.empty, { color: colors.mutedForeground }]}>Nenhuma proposta vinculada.</Text>;
  }

  return (
    <View style={styles.list}>
      {proposals.map((proposal) => {
        const content = (
          <>
            <View style={styles.top}>
              <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
                {proposal.viewerCanEdit ? proposal.propType : proposal.programName}
              </Text>
              <Text style={[styles.status, { color: colors.primary }]}>
                {PROPOSAL_STATUS_LABELS[proposal.status]}
              </Text>
            </View>
            {proposal.viewerCanEdit ? (
              <>
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                  {proposal.programName} · {proposal.createdByName}
                </Text>
                {!!proposal.investValue && (
                  <Text style={[styles.value, { color: colors.foreground }]}>R$ {proposal.investValue}</Text>
                )}
              </>
            ) : (
              <View style={styles.restricted}>
                <Feather name="lock" size={14} color={colors.mutedForeground} />
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                  Responsavel: {proposal.createdByName}. Proposta de outro responsavel.
                </Text>
              </View>
            )}
          </>
        );

        if (!proposal.viewerCanEdit) {
          return <View key={proposal.id} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.muted }]}>{content}</View>;
        }
        return (
          <TouchableOpacity
            key={proposal.id}
            accessibilityRole="button"
            style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => router.push(`/proposal/${proposal.id}`)}
          >
            {content}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  status: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  meta: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  value: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  restricted: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  empty: { fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 18 },
});

