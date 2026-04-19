import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InventoryListScreen from '../screens/InventoryListScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';

const Stack = createNativeStackNavigator();

export default function InventoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="InventoryList" 
        component={InventoryListScreen} 
        options={{ title: 'Inventory' }}
      />
      <Stack.Screen 
        name="ItemDetail" 
        component={ItemDetailScreen} 
        options={{ title: 'Item Details' }}
      />
    </Stack.Navigator>
  );
}
