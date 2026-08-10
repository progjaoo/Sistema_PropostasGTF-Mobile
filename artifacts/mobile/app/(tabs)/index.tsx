// This file is kept for scaffold compatibility but not used in navigation.
// The app routes through (public), (comercial), and (admin) groups instead.
import { Redirect } from 'expo-router';
export default function TabsIndex() {
  return <Redirect href="/" />;
}
