import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { FormInput } from '@/components/FormInput';
import { useToast } from '@/components/ToastProvider';
import { apiCall, ApiError } from '@/src/api/client';
import { useColors } from '@/hooks/useColors';
import { AuthScaffold } from '@/src/features/auth/AuthScaffold';
import { UICard, UIButton, UIEmptyState } from '@/src/ui';

export default function RegisterScreen() {
  const colors = useColors();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Nome deve ter ao menos 2 caracteres';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = 'E-mail inválido';
    if (!password || password.length < 8) e.password = 'Senha deve ter ao menos 8 caracteres';
    if (password !== confirm) e.confirm = 'As senhas não conferem';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await apiCall('POST', '/auth/register-commercial', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) showToast('E-mail já cadastrado.', 'error');
        else showToast(err.message, 'error');
      } else {
        showToast('Erro de conexão.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthScaffold showBrand contentStyle={styles.doneContent}>
        <UIEmptyState
          icon="check-circle"
          title="Cadastro realizado!"
          description="Sua conta foi criada. Aguarde o ADMIN liberar seu acesso e as Empresas disponíveis."
          actionLabel="Voltar ao Login"
          onAction={() => router.replace('/(public)/login')}
        />
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold
      title="Criar acesso comercial"
      subtitle="Crie sua conta como vendedor. O ADMIN precisará aprovar seu acesso às Empresas."
      showBack
    >
      <UICard variant="elevated" style={styles.card}>
        <FormInput
          label="Nome completo" required leftIcon="user" placeholder="Seu nome"
          value={name} onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: '' })); }}
          error={errors.name} returnKeyType="next"
        />
        <FormInput
          label="E-mail" required leftIcon="mail" placeholder="seu@email.com"
          keyboardType="email-address" autoCapitalize="none"
          value={email} onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: '' })); }}
          error={errors.email} returnKeyType="next"
        />
        <FormInput
          label="Senha" required leftIcon="lock" placeholder="Mínimo 8 caracteres" isPassword
          value={password} onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: '' })); }}
          error={errors.password} returnKeyType="next"
        />
        <FormInput
          label="Confirmar senha" required leftIcon="lock" placeholder="Repita a senha" isPassword
          value={confirm} onChangeText={(t) => { setConfirm(t); setErrors((e) => ({ ...e, confirm: '' })); }}
          error={errors.confirm} returnKeyType="done" onSubmitEditing={handleRegister}
        />

        <UIButton
          variant="primary"
          size="lg"
          onPress={handleRegister}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Criar conta comercial"
          accessibilityState={{ disabled: loading, busy: loading }}
        >
          {loading ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>Criar conta</Text>}
        </UIButton>
      </UICard>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  card: { gap: 16 },
  submitBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  doneContent: { justifyContent: 'center', flexGrow: 1 },
});
