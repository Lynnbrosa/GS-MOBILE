import { NavigatorScreenParams } from '@react-navigation/native';
import { Coordinate, QueryEndpoint, SatelliteQuery } from '../types';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type QueryDetailParams = {
  queryId: string;
  inline?: SatelliteQuery;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  NewQuery: { coordinate?: Coordinate; endpoint?: QueryEndpoint } | undefined;
  QueryDetail: QueryDetailParams;
  Events: undefined;
  Apod: undefined;
};

export type FavoritesStackParamList = {
  FavoritesMain: undefined;
  NewFavorite: { coordinate?: Coordinate; alias?: string; ndvi?: number } | undefined;
};

export type QueriesStackParamList = {
  QueriesMain: undefined;
  QueryDetail: QueryDetailParams;
};

export type MainTabsParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  QueriesTab: NavigatorScreenParams<QueriesStackParamList>;
  FavoritesTab: NavigatorScreenParams<FavoritesStackParamList>;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabsParamList>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
