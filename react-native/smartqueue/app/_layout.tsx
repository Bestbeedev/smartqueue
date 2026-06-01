import { Slot } from 'expo-router';
import '../global.css';
import NotificationsProvider from '../src/components/NotificationsProvider';

export default function RootLayout() {
  return (
    <>
      <NotificationsProvider />
      <Slot />
    </>
  );
}
