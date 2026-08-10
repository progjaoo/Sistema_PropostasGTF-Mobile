import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiCall } from '@/src/api/client';
import { useAuthStore } from '@/src/store/authStore';
import { getRecallAdvertiserName, getRecallReminderList, RecallReminderPayload } from '@/src/utils/recallReminders';
import { useColors } from '@/hooks/useColors';
import { UIBottomSheet, UIButton, UICard } from '@/src/ui';
import { spacing } from '@/src/theme';

let displayedForUser: string | null = null;

export function RecallReminderSheet() {
  const colors = useColors();
  const userId = useAuthStore((state) => state.user?.id);
  const [visible, setVisible] = useState(false);
  const query = useQuery({
    queryKey: ['recall-reminders', 'login-sheet'],
    queryFn: () => apiCall<RecallReminderPayload>('GET', '/recall-reminders?limit=5'),
    enabled: !!userId,
  });
  const reminders = getRecallReminderList(query.data).filter((item) => item.status === 'PENDING').slice(0, 5);

  useEffect(() => {
    if (userId && reminders.length && displayedForUser !== userId) {
      displayedForUser = userId;
      setVisible(true);
    }
  }, [userId, reminders.length]);

  return (
    <UIBottomSheet visible={visible} onClose={() => setVisible(false)} style={styles.sheet}>
          <Text style={[styles.title, { color: colors.foreground }]}>Oportunidades de recaptura</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            Estes contatos ja podem receber uma nova abordagem comercial.
          </Text>
          {reminders.map((reminder) => (
            <UICard
              key={reminder.id}
              variant="muted"
              style={styles.item}
              onPress={() => {
                setVisible(false);
                router.push(`/proposal/${reminder.proposalId}`);
              }}
            >
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>{getRecallAdvertiserName(reminder)}</Text>
              <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{reminder.milestoneMonths} meses</Text>
            </UICard>
          ))}
          <UIButton title="Continuar" size="lg" onPress={() => setVisible(false)} />
    </UIBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { gap: spacing.sm },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  description: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginBottom: 4 },
  item: { minHeight: 56 },
  itemTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  itemMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
});
