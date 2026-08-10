import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';

export default function AdvertiserLayout() {
  const { user, isInitialized } = useAuthStore();
  if (!isInitialized) return null;
  if (!user) return <Redirect href="/(public)/login" />;
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
