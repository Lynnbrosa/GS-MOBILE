import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueriesStackParamList } from './types';
import { QueriesScreen } from '../screens/main/QueriesScreen';
import { QueryDetailScreen } from '../screens/main/QueryDetailScreen';

const Stack = createNativeStackNavigator<QueriesStackParamList>();

export function QueriesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="QueriesMain" component={QueriesScreen} />
      <Stack.Screen name="QueryDetail" component={QueryDetailScreen} />
    </Stack.Navigator>
  );
}
