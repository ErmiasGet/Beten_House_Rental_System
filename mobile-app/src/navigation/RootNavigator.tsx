import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';
import { LoginScreen } from '../screens/Login/LoginScreen';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { HousesScreen } from '../screens/Houses/HousesScreen';
import { RoomsScreen } from '../screens/Rooms/RoomsScreen';
import { TenantsListScreen } from '../screens/Tenants/TenantsListScreen';
import { TenantDetailScreen } from '../screens/Tenants/TenantDetailScreen';
import { ContractsScreen } from '../screens/Contracts/ContractsScreen';
import { ContractDetailScreen } from '../screens/Contracts/ContractDetailScreen';
import { PaymentsScreen } from '../screens/Payments/PaymentsScreen';
import { ReportsScreen } from '../screens/Reports/ReportsScreen';
import { NotificationsScreen } from '../screens/Notifications/NotificationsScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { ActivityIndicator, View, Text, Pressable } from 'react-native';
import { useNotifications } from '../notifications/NotificationProvider';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const TenantStack = createNativeStackNavigator();
const ContractStack = createNativeStackNavigator();

function TenantStackScreen() {
  return (
    <TenantStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0ea5e9' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <TenantStack.Screen
        name="TenantsList"
        component={TenantsListScreen}
        options={{ title: 'Tenants' }}
      />
      <TenantStack.Screen
        name="TenantDetail"
        component={TenantDetailScreen}
        options={{ title: 'Tenant Details' }}
      />
    </TenantStack.Navigator>
  );
}

function ContractStackScreen() {
  return (
    <ContractStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0ea5e9' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <ContractStack.Screen
        name="ContractsList"
        component={ContractsScreen}
        options={{ title: 'Contracts' }}
      />
      <ContractStack.Screen
        name="ContractDetail"
        component={ContractDetailScreen}
        options={{ title: 'Contract Details' }}
      />
    </ContractStack.Navigator>
  );
}

function TabIcon({
  name,
  size,
  color,
}: {
  name: keyof typeof Ionicons.glyphMap;
  size: number;
  color: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{ transform: [{ scale: hovered ? 1.2 : 1 }] }}
    >
      <Ionicons name={name} size={hovered ? size + 2 : size} color={color} />
    </Pressable>
  );
}

function MainTabs() {
  const { unreadCount } = useNotifications();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          switch (route.name) {
            case 'Homes':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Houses':
              iconName = focused ? 'business' : 'business-outline';
              break;
            case 'Rooms':
              iconName = focused ? 'bed' : 'bed-outline';
              break;
            case 'Tenants':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Contracts':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Payments':
              iconName = focused ? 'card' : 'card-outline';
              break;
            case 'Reports':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
            case 'Notifications':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
          }
          return <TabIcon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#0ea5e9',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Homes" component={DashboardScreen} options={{ title: 'Homes' }} />
      <Tab.Screen name="Houses" component={HousesScreen} />
      <Tab.Screen name="Rooms" component={RoomsScreen} />
      <Tab.Screen name="Tenants" component={TenantStackScreen} options={{ headerShown: false }} />
      <Tab.Screen
        name="Contracts"
        component={ContractStackScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#dc2626',
            fontSize: 10,
            minWidth: 16,
            height: 16,
            lineHeight: 16,
          },
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
        }}
      >
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0ea5e9' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '600' },
        headerShown: false,
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: true, title: 'Profile Settings' }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ animationTypeForReplace: 'pop' }}
        />
      )}
    </Stack.Navigator>
  );
}
