import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FormInput } from '@/components/FormInput';
import { useToast } from '@/components/ToastProvider';
import { ApiError } from '@/src/api/client';
import { useColors } from '@/hooks/useColors';
import { AuthScaffold } from '@/src/features/auth/AuthScaffold';
import { getResetToken, resetPassword } from '@/src/features/auth/passwordReset';
import { UICard, UIButton, UIEmptyState } from '@/src/ui';
import { BRAND } from '@/src/config/brand';

export default function ResetPasswordScreen() {
  const colors = useColors();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = getResetToken(params.token);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenRejected, setTokenRejected] = useState(false);
  const [success, setSuccess] = useState(false);
  const linkInvalid = !token || tokenRejected;

  const validate = () => {
    let ok = true;
    if (newPassword.length < 8 || newPassword.length > 128) {
      setPasswordError('Use entre 8 e 128 caracteres.');
      ok = false;
    } else {
      setPasswordError('');
    }
    if (confirmPassword !== newPassword) {
      setConfirmError('As senhas não conferem.');
      ok = false;
    } else {
      setConfirmError('');
    }
    return ok;
  };

  const handleReset = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPassword({
        token: token!,
        newPassword,
        confirmPassword,
      });
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
      showToast('Senha redefinida com sucesso.', 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setTokenRejected(true);
          setNewPassword('');
          setConfirmPassword('');
          showToast('Link inválido, expirado ou já utilizado.', 'error');
        } else if (err.status === 429) {
          showToast('Muitas tentativas. Aguarde alguns minutos.', 'warning');
        } else {
          showToast(err.message, 'error');
        }
      } else if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Erro de conexão. Tente novamente.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      title="Redefinir senha"
      subtitle={`Crie uma nova senha para acessar o ${BRAND.productName}.`}
      showBack
      onBack={() => router.replace('/(public)/login')}
    >

      {linkInvalid ? (
        <UIEmptyState
          icon="alert-triangle"
          title="Link inválido ou expirado"
          description="Solicite um novo link de recuperação para continuar."
          actionLabel="Solicitar novo link"
          onAction={() => router.replace('/(public)/forgot-password')}
        />
      ) : success ? (
        <UIEmptyState
          icon="check-circle"
          title="Senha redefinida"
          description="Entre novamente usando sua nova senha."
          actionLabel="Ir para o Login"
          onAction={() => router.replace('/(public)/login')}
        />
      ) : <UICard variant="elevated" style={styles.card}>
        <FormInput
          label="Nova senha"
          required
          leftIcon="lock"
          isPassword
          value={newPassword}
          onChangeText={(value) => { setNewPassword(value); setPasswordError(''); }}
          error={passwordError}
          hint="Mínimo 8 caracteres."
          returnKeyType="next"
          textContentType="newPassword"
          autoComplete="new-password"
          accessibilityLabel="Nova senha"
        />
        <FormInput
          label="Confirmar senha"
          required
          leftIcon="lock"
          isPassword
          value={confirmPassword}
          onChangeText={(value) => { setConfirmPassword(value); setConfirmError(''); }}
          error={confirmError}
          returnKeyType="done"
          onSubmitEditing={handleReset}
          textContentType="newPassword"
          autoComplete="new-password"
          accessibilityLabel="Confirmar nova senha"
        />
        <UIButton
          variant="primary"
          size="lg"
          onPress={handleReset}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Salvar nova senha"
          accessibilityState={{ disabled: loading, busy: loading }}
        >
          {loading ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Salvar nova senha</Text>}
        </UIButton>
      </UICard>}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  card: { gap: 16 },
  btnText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
});
