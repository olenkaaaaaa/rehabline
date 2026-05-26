import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const NotificationManager = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    if (!('Notification' in window)) return;

    if (
      Notification.permission !== 'granted' &&
      Notification.permission !== 'denied'
    ) {
      Notification.requestPermission();
    }
  }, [user]);

  return null;
};

export default NotificationManager;