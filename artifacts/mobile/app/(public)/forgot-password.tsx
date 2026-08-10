import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { FormInput } from '@/components/FormInput';
import { useToast } from '@/components/ToastProvider';
import { apiCall } from '@/src/api/client';
import { useColors } from '@/hooks/useColors';

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Informe um e-mail válido');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await apiCall('POST', '/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch {
      showToast('Erro ao enviar. Tente novamente.', 'error');
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
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Recuperar senha</Text>
        <View style={{ width: 24 }} />
      </View>

      {sent ? (
        <View style={styles.sentContainer}>
          <View style={[styles.iconWrap, { backgroundColor: colors.info + '15' }]}>
            <Feather name="mail" size={40} color={colors.info} />
          </View>
          <Text style={[styles.sentTitle, { color: colors.foreground }]}>Verifique seu e-mail</Text>
          <Text style={[styles.sentDesc, { color: colors.mutedForeground }]}>
            Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação em breve.
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/(public)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>Voltar ao Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            Informe seu e-mail cadastrado. Enviaremos um link para redefinir sua senha.
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FormInput
              label="E-mail" required leftIcon="mail" placeholder="seu@email.com"
              keyboardType="email-address" autoCapitalize="none"
              value={email} onChangeText={(t) => { setEmail(t); setError(''); }}
              error={error} returnKeyType="done" onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }, loading && styles.disabled]}
              onPress={handleSend} disabled={loading} activeOpacity={0.8}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Enviar instruções</Text>}
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  description: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  card: { borderRadius: 16, borderWidth: 1, padding: 20, gap: 16 },
  btn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFF' },
  disabled: { opacity: 0.7 },
  sentContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingVertical: 40 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  sentTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  sentDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
});
