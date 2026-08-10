import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { FormInput } from '@/components/FormInput';
import { useToast } from '@/components/ToastProvider';
import { apiCall, ApiError } from '@/src/api/client';
import { useColors } from '@/hooks/useColors';
import { AuthScaffold } from '@/src/features/auth/AuthScaffold';
import { UICard, UIButton } from '@/src/ui';

export default function ResetPasswordScreen() {
  const colors = useColors();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let ok = true;
    if (!token) {
      showToast('Link de recuperação inválido.', 'error');
      ok = false;
    }
    if (newPassword.length < 8) {
      setPasswordError('Use pelo menos 8 caracteres.');
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
      await apiCall('POST', '/auth/reset-password', {
        token,
        newPassword,
        confirmPassword,
      });
      showToast('Senha redefinida com sucesso.', 'success');
      router.replace('/(public)/login');
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.message, err.status === 429 ? 'warning' : 'error');
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
      subtitle="Crie uma nova senha para acessar o GTF Propostas."
      showBack
      onBack={() => router.replace('/(public)/login')}
    >

      {!token && (
        <View style={[styles.warning, { backgroundColor: colors.warning + '14', borderColor: colors.warning + '50' }]}>
          <Feather name="alert-triangle" size={18} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.foreground }]}>Token ausente ou inválido. Solicite um novo link.</Text>
        </View>
      )}

      <UICard variant="elevated" style={styles.card}>
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
          variant={token ? 'primary' : 'secondary'}
          size="lg"
          onPress={handleReset}
          disabled={!token || loading}
          accessibilityRole="button"
          accessibilityLabel="Salvar nova senha"
          accessibilityState={{ disabled: !token || loading, busy: loading }}
        >
          {loading ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.btnText, { color: token ? colors.primaryForeground : colors.foreground }]}>Salvar nova senha</Text>}
        </UIButton>
      </UICard>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  warning: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  warningText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  card: { gap: 16 },
  btnText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
});
