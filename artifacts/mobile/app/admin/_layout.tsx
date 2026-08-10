import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';

export default function AdminStackLayout() {
  const { user, isInitialized } = useAuthStore();
  if (!isInitialized) return null;
  if (user?.role !== 'ADMIN') return <Redirect href={user ? '/(comercial)' : '/(public)/login'} />;
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
