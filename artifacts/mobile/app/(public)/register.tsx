import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { FormInput } from '@/components/FormInput';
import { useToast } from '@/components/ToastProvider';
import { apiCall, ApiError } from '@/src/api/client';
import { useColors } from '@/hooks/useColors';

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
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

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (done) {
    return (
      <View style={[styles.doneContainer, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <View style={[styles.doneIconWrap, { backgroundColor: colors.success + '15' }]}>
          <Feather name="check-circle" size={48} color={colors.success} />
        </View>
        <Text style={[styles.doneTitle, { color: colors.foreground }]}>Cadastro realizado!</Text>
        <Text style={[styles.doneDesc, { color: colors.mutedForeground }]}>
          Sua conta foi criada. Aguarde o ADMIN liberar seu acesso e as Empresas disponíveis.
        </Text>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.replace('/(public)/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.backBtnText}>Voltar ao Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 }]}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Criar acesso comercial</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        Crie sua conta como vendedor. O ADMIN precisará aprovar seu acesso às Empresas.
      </Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
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

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }, loading && styles.disabled]}
          onPress={handleRegister} disabled={loading} activeOpacity={0.8}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Criar conta</Text>}
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
  card: { borderRadius: 16, borderWidth: 1, padding: 20, gap: 16 },
  submitBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  submitBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFF' },
  disabled: { opacity: 0.7 },
  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 },
  doneIconWrap: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  doneDesc: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  backBtn: { paddingHorizontal: 32, paddingVertical: 13, borderRadius: 12, marginTop: 8 },
  backBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFF' },
});
