import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FavoritesStackParamList } from './types';
import { FavoritesScreen } from '../screens/main/FavoritesScreen';
import { NewFavoriteScreen } from '../screens/main/NewFavoriteScreen';

const Stack = createNativeStackNavigator<FavoritesStackParamList>();

export function FavoritesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FavoritesMain" component={FavoritesScreen} />
      <Stack.Screen name="NewFavorite" component={NewFavoriteScreen} />
    </Stack.Navigator>
  );
}
