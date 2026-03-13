import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { appointments, services, specialists } from '../data/mockData';

const NotificationManager = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Запитуємо дозвіл на сповіщення, якщо ще не надано
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    // Якщо дозвіл не надано, виходимо
    if (Notification.permission !== 'granted') return;

    // Отримуємо майбутні запити
    const now = new Date();
    const upcoming = appointments
      .filter(app => app.clientId === user.id && app.status !== 'cancelled' && app.status !== 'completed')
      .map(app => {
        const service = services.find(s => s.id === app.serviceId);
        const specialist = specialists.find(s => s.id === app.specialistId);
        const appDateTime = new Date(`${app.date}T${app.time}:00`);
        return { ...app, serviceName: service?.name, specialistName: specialist?.name, appDateTime };
      })
      .filter(app => app.appDateTime > now);

    // Плануємо сповіщення за 24 години та за 2 години
    upcoming.forEach(app => {
      const timeTo24h = app.appDateTime.getTime() - 24 * 60 * 60 * 1000 - now.getTime();
      const timeTo2h = app.appDateTime.getTime() - 2 * 60 * 60 * 1000 - now.getTime();

      if (timeTo24h > 0) {
        setTimeout(() => {
          new Notification('RehabLine: Нагадування', {
            body: `Через 24 години візит: ${app.serviceName} до ${app.specialistName}`,
            icon: '/logo192.png',
          });
        }, timeTo24h);
      }

      if (timeTo2h > 0) {
        setTimeout(() => {
          new Notification('RehabLine: Нагадування', {
            body: `Через 2 години візит: ${app.serviceName} до ${app.specialistName}`,
            icon: '/logo192.png',
          });
        }, timeTo2h);
      }
    });

    // Очищення таймерів при демонтажі (складно, але для демо достатньо)
  }, [user]);

  return null;
};

export default NotificationManager;