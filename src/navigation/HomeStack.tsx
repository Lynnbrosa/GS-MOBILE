import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import { HomeScreen } from '../screens/main/HomeScreen';
import { NewQueryScreen } from '../screens/main/NewQueryScreen';
import { QueryDetailScreen } from '../screens/main/QueryDetailScreen';
import { EventsScreen } from '../screens/main/EventsScreen';
import { ApodScreen } from '../screens/main/ApodScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="NewQuery" component={NewQueryScreen} />
      <Stack.Screen name="QueryDetail" component={QueryDetailScreen} />
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="Apod" component={ApodScreen} />
    </Stack.Navigator>
  );
}
