import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { FormInput } from '@/components/FormInput';
import { useToast } from '@/components/ToastProvider';
import { apiCall, ApiError } from '@/src/api/client';
import { useColors } from '@/hooks/useColors';

export default function ResetPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
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

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 }]}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(public)/login')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Redefinir senha</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        Crie uma nova senha para acessar o GTF Propostas.
      </Text>

      {!token && (
        <View style={[styles.warning, { backgroundColor: colors.warning + '14', borderColor: colors.warning + '50' }]}>
          <Feather name="alert-triangle" size={18} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.foreground }]}>Token ausente ou inválido. Solicite um novo link.</Text>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: token ? colors.primary : colors.muted }, loading && styles.disabled]}
          onPress={handleReset}
          disabled={!token || loading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Salvar nova senha"
          accessibilityState={{ disabled: !token || loading, busy: loading }}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Salvar nova senha</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  description: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  warning: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  warningText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  card: { borderRadius: 16, borderWidth: 1, padding: 20, gap: 16 },
  btn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFF' },
  disabled: { opacity: 0.7 },
});
