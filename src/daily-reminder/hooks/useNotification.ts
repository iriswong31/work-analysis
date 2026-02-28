// ==========================================
// PWA 通知 Hook
// ==========================================

import { useCallback, useEffect, useState } from 'react';
import { Reminder } from '@/types/reminder';
import { generateMessage, getTimeGreeting } from '../constants/messages';

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const isSupported = 'Notification' in window;
    setSupported(isSupported);
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'denied' as NotificationPermission;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return 'denied' as NotificationPermission;
    }
  }, []);

  const sendNotification = useCallback(
    (reminder: Reminder) => {
      if (permission !== 'granted') return;

      const message = generateMessage(
        reminder.category,
        reminder.urgency,
        reminder.customMessage
      );

      const greeting = getTimeGreeting();

      new Notification(`${greeting}${reminder.title}`, {
        body: message.replace('\n', ' '),
        icon: '/reminder-icon.png',
        tag: `reminder-${reminder.id}`,
        requireInteraction: true,
      });
    },
    [permission]
  );

  return { permission, requestPermission, sendNotification, supported };
}
