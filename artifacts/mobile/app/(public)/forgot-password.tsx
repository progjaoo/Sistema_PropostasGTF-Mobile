import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { FormInput } from '@/components/FormInput';
import { useToast } from '@/components/ToastProvider';
import { ApiError } from '@/src/api/client';
import { useColors } from '@/hooks/useColors';
import { AuthScaffold } from '@/src/features/auth/AuthScaffold';
import { requestPasswordReset } from '@/src/features/auth/passwordReset';
import { UICard, UIButton, UIEmptyState } from '@/src/ui';

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (requestError) {
      const message = requestError instanceof ApiError && requestError.status === 429
        ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
        : requestError instanceof Error
          ? requestError.message
          : 'Erro de conexão. Tente novamente.';
      setError(message);
      showToast(message, requestError instanceof ApiError && requestError.status === 429 ? 'warning' : 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      title="Recuperar senha"
      subtitle={!sent ? 'Informe seu e-mail cadastrado. Enviaremos um link para redefinir sua senha.' : undefined}
      showBack={!sent}
      showBrand={sent}
      contentStyle={sent ? styles.sentContent : undefined}
    >
      {sent ? (
        <UIEmptyState
          icon="mail"
          title="Verifique seu e-mail"
          description="Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação em breve."
          actionLabel="Voltar ao Login"
          onAction={() => router.replace('/(public)/login')}
        />
      ) : (
        <UICard variant="elevated" style={styles.card}>
          <FormInput
            label="E-mail" required leftIcon="mail" placeholder="seu@email.com"
            keyboardType="email-address" autoCapitalize="none"
            autoCorrect={false}
            value={email} onChangeText={(t) => { setEmail(t); setError(''); }}
            error={error} returnKeyType="done" onSubmitEditing={handleSend}
          />
          <UIButton
            variant="primary"
            size="lg"
            onPress={handleSend}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Enviar instruções de recuperação"
            accessibilityState={{ disabled: loading, busy: loading }}
          >
            {loading ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Enviar instruções</Text>}
          </UIButton>
        </UICard>
      )}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  card: { gap: 16 },
  btnText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  sentContent: { justifyContent: 'center', flexGrow: 1 },
});
