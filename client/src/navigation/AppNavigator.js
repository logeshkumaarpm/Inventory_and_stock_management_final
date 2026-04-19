import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import InventoryStack from './InventoryStack';
import QueriesScreen from '../screens/QueriesScreen';
import ActivityScreen from '../screens/ActivityScreen';
import AdminScreen from '../screens/AdminScreen';
import { AuthContext } from '../contexts/AuthContext';
import { theme } from '../theme';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'Admin';
  const isStudent = user?.role === 'Student';
  const isStaff = user?.role === 'Staff';
  const canOpenQueries = isAdmin || isStudent || isStaff;
  const showActivity = isAdmin || isStudent;
  const queryLabel = isAdmin ? 'Queries' : isStaff ? 'Queries' : 'Feedback';

  return (
      <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          paddingBottom: 10,
          paddingTop: 8,
          height: 72,
          borderTopWidth: 0,
          backgroundColor: theme.colors.surface,
          shadowColor: '#0F172A',
          shadowOpacity: 0.08,
          shadowRadius: 18,
          elevation: 18,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
      }}
      >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryStack} 
        options={{ tabBarLabel: 'Inventory' }}
      />
      {canOpenQueries && (
        <Tab.Screen 
          name="Feedback" 
          component={QueriesScreen} 
          options={{ tabBarLabel: queryLabel }}
        />
      )}
      {showActivity && (
        <Tab.Screen
          name="Activity"
          component={ActivityScreen}
          options={{ tabBarLabel: 'Activity' }}
        />
      )}
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{ tabBarLabel: 'Admin' }}
        />
      )}
    </Tab.Navigator>
  );
}
