import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Advertiser } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { UIButton, UICard, UIEmptyState, UIInput } from '@/src/ui';
import { spacing } from '@/src/theme';

export function LeadToClientSelector({ leads, onPromote, pending = false }: { leads: Advertiser[]; onPromote: (id: string) => void; pending?: boolean }) {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = leads.filter((lead) => `${lead.tradeName} ${lead.contactName ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  const selected = filtered.find((lead) => lead.id === selectedId) ?? leads.find((lead) => lead.id === selectedId);
  return <View style={styles.container}><UIInput leftIcon="search" placeholder="Buscar lead" value={search} onChangeText={setSearch} /><View style={styles.list}>{filtered.map((lead) => <UICard key={lead.id} variant={selectedId === lead.id ? 'elevated' : 'default'} style={[styles.row, selectedId === lead.id && { borderColor: colors.primary }]} onPress={() => setSelectedId(lead.id)} accessibilityRole="button" accessibilityLabel={lead.tradeName}><View style={{ flex: 1 }}><Text style={[styles.name, { color: colors.foreground }]}>{lead.tradeName}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{lead.contactName || lead.contactEmail || 'Sem contato'}</Text></View></UICard>)}</View>{!filtered.length && <UIEmptyState icon="users" title="Nenhum lead encontrado" />}{selected && <View style={styles.confirm}><Text style={[styles.confirmText, { color: colors.mutedForeground }]}>Preservaremos nome, origem, contato e histórico de {selected.tradeName}.</Text><UIButton title={pending ? 'Convertendo...' : 'Converter em cliente'} onPress={() => onPromote(selected.id)} disabled={pending} /></View>}</View>;
}

const styles = StyleSheet.create({ container: { gap: spacing.md }, list: { gap: spacing.sm }, row: { flexDirection: 'row', minHeight: 62, borderWidth: 1, borderColor: 'transparent' }, name: { fontFamily: 'Inter_700Bold', fontSize: 15 }, meta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 }, confirm: { gap: spacing.sm }, confirmText: { fontSize: 12, lineHeight: 18 } });
