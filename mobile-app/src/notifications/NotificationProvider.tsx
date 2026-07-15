import React, { useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { notificationsAPI } from '../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

export const NotificationContext = React.createContext<NotificationContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
});

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation<any>();
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsAPI.getAll({ page: 1, limit: 1 });
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('NotificationProvider refreshUnreadCount error:', error);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    refreshUnreadCount();
    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      refreshUnreadCount();
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      refreshUnreadCount();
      try {
        navigation.navigate('Main', { screen: 'Notifications' });
      } catch (error) {
        console.error('NotificationProvider navigation error:', error);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated, refreshUnreadCount, navigation]);

  const registerForPushNotifications = async () => {
    if (Platform.OS === 'web') return;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0ea5e9',
        });
      }

      const expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
      await notificationsAPI.registerPushToken(expoPushToken);
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return React.useContext(NotificationContext);
}

export async function sendLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null,
  });
}
