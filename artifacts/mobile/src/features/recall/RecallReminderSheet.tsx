import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiCall } from '@/src/api/client';
import { useAuthStore } from '@/src/store/authStore';
import { getRecallAdvertiserName, getRecallReminderList, RecallReminderPayload } from '@/src/utils/recallReminders';
import { useColors } from '@/hooks/useColors';

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
    <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
      <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(event) => event.stopPropagation()}>
          <Text style={[styles.title, { color: colors.foreground }]}>Oportunidades de recaptura</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            Estes contatos ja podem receber uma nova abordagem comercial.
          </Text>
          {reminders.map((reminder) => (
            <TouchableOpacity
              key={reminder.id}
              style={[styles.item, { borderColor: colors.border }]}
              onPress={() => {
                setVisible(false);
                router.push(`/proposal/${reminder.proposalId}`);
              }}
            >
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>{getRecallAdvertiserName(reminder)}</Text>
              <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{reminder.milestoneMonths} meses</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.close, { backgroundColor: colors.primary }]} onPress={() => setVisible(false)}>
            <Text style={styles.closeText}>Continuar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.5)', justifyContent: 'center', padding: 20 },
  sheet: { borderRadius: 16, padding: 20, gap: 10 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  description: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginBottom: 4 },
  item: { minHeight: 56, borderWidth: 1, borderRadius: 10, padding: 12 },
  itemTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  itemMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  close: { minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  closeText: { color: '#FFF', fontFamily: 'Inter_600SemiBold' },
});

