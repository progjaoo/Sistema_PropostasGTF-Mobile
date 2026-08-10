import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { FormInput } from '@/components/FormInput';
import { useToast } from '@/components/ToastProvider';
import { useAuthStore } from '@/src/store/authStore';
import { apiCall, ApiError } from '@/src/api/client';
import { MobileAuthResponse } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { AuthScaffold } from '@/src/features/auth/AuthScaffold';
import { UICard, UIButton } from '@/src/ui';

export default function LoginScreen() {
  const colors = useColors();
  const { showToast } = useToast();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = () => {
    let ok = true;
    if (!email.trim()) { setEmailError('Informe o e-mail'); ok = false; }
    else if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('E-mail inválido'); ok = false; }
    else setEmailError('');
    if (!password) { setPasswordError('Informe a senha'); ok = false; }
    else setPasswordError('');
    return ok;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await apiCall<MobileAuthResponse>('POST', '/auth/mobile/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      await setAuth(data.user, data.accessToken, data.refreshToken);
      if (data.user.role === 'ADMIN') {
        router.replace('/(admin)');
      } else {
        router.replace('/(comercial)');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          showToast('Credenciais inválidas ou conta inativa.', 'error');
          setPassword('');
        } else if (err.status === 429) {
          showToast('Muitas tentativas. Aguarde e tente novamente.', 'warning');
        } else if (err.status >= 500) {
          showToast('API indisponível. Tente novamente em alguns minutos.', 'error');
        } else {
          showToast(err.message, 'error');
        }
      } else {
        showToast('Erro de conexão. Verifique sua internet.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      showBrand
      footer={
        <Pressable
          onPress={() => router.push('/(public)/register')}
          accessibilityRole="button"
          accessibilityLabel="Criar acesso comercial"
          style={({ pressed }) => [styles.registerLink, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.registerText, { color: colors.mutedForeground }]}>
            Não tem acesso?{' '}
            <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>
              Criar acesso comercial
            </Text>
          </Text>
        </Pressable>
      }
    >
      <UICard variant="elevated" style={styles.card}>
        <Text style={[styles.title, { color: colors.foreground }]}>Entrar no sistema</Text>
        <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
          Acesse suas propostas, clientes e avisos comerciais.
        </Text>

        <FormInput
          label="E-mail"
          leftIcon="mail"
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={(t) => { setEmail(t); setEmailError(''); }}
          error={emailError}
          returnKeyType="next"
          textContentType="username"
          autoComplete="email"
          accessibilityLabel="E-mail de login"
          accessibilityHint="Informe o e-mail cadastrado no sistema"
        />

        <FormInput
          label="Senha"
          leftIcon="lock"
          placeholder="••••••••"
          isPassword
          value={password}
          onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
          error={passwordError}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          textContentType="password"
          autoComplete="password"
          accessibilityLabel="Senha"
          accessibilityHint="Informe sua senha de acesso"
        />

        <Pressable
          style={({ pressed }) => [styles.forgotBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push('/(public)/forgot-password')}
          accessibilityRole="button"
          accessibilityLabel="Esqueceu a senha"
        >
          <Text style={[styles.forgotText, { color: colors.primary }]}>Esqueceu a senha?</Text>
        </Pressable>

        <UIButton
          variant="primary"
          size="lg"
          onPress={handleLogin}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Entrar no sistema"
          accessibilityState={{ disabled: loading, busy: loading }}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.loginBtnText, { color: colors.primaryForeground }]}>Entrar</Text>
          )}
        </UIButton>
      </UICard>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Inter_800ExtraBold',
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
    marginTop: -8,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -6,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  registerLink: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
