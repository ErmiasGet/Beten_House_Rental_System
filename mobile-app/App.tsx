import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/store/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { NotificationProvider } from './src/notifications/NotificationProvider';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <NotificationProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </NotificationProvider>
      </NavigationContainer>
    </AuthProvider>
  );
}
