import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { FormInput } from '@/components/FormInput';
import { useToast } from '@/components/ToastProvider';
import { useAuthStore } from '@/src/store/authStore';
import { apiCall, ApiError } from '@/src/api/client';
import { MobileAuthResponse } from '@/src/types';
import { useColors } from '@/hooks/useColors';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
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

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 40, paddingBottom: bottomPad + 24 }]}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      <View style={styles.brand}>
        <Image
          source={require('@/assets/brand/gtf-logo-completa.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Sistema Comercial GTF</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Entrar</Text>

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

        <TouchableOpacity
          style={[styles.forgotBtn]}
          onPress={() => router.push('/(public)/forgot-password')}
          accessibilityRole="button"
          accessibilityLabel="Esqueceu a senha"
        >
          <Text style={[styles.forgotText, { color: colors.primary }]}>Esqueceu a senha?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginBtn, { backgroundColor: colors.primary }, loading && styles.disabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Entrar no sistema"
          accessibilityState={{ disabled: loading, busy: loading }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginBtnText}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.registerLink} onPress={() => router.push('/(public)/register')}>
        <Text style={[styles.registerText, { color: colors.mutedForeground }]}>
          Não tem acesso?{' '}
          <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>
            Criar acesso comercial
          </Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    gap: 24,
  },
  brand: {
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 200,
    height: 72,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -6,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  loginBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.7,
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
