import { Stack, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { UIEmptyState } from '@/src/ui';

export default function NotFoundScreen() {
  const colors = useColors();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <UIEmptyState
          icon="compass"
          title="Tela não encontrada"
          description="O caminho solicitado não existe ou foi movido."
          actionLabel="Voltar ao início"
          onAction={() => router.replace('/')}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
