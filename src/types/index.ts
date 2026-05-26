export type Account = {
  id: string;
  email: string;
  name: string;
};

export type Coordinate = {
  lat: number;
  lng: number;
};

export type SatelliteSource = 'Landsat' | 'Sentinel-2';

export type NdviResult = {
  ndvi: number;
  capturedAt: string;
  source: SatelliteSource;
};

export type LandUseResult = {
  vegetation: number;
  urban: number;
  water: number;
  bareSoil: number;
};

export type QueryEndpoint = 'landuse' | 'vegetation';

export type SatelliteQuery = {
  id: string;
  coordinate: Coordinate;
  endpoint: QueryEndpoint;
  result: NdviResult | LandUseResult;
  executedAt: string;
};

export type Favorite = {
  id: string;
  alias: string;
  coordinate: Coordinate;
  lastNdvi?: number;
  lastCheckedAt?: string;
};

export type WeatherSnapshot = {
  temperature: number;
  humidity: number;
  weatherCode: number;
  fetchedAt: string;
};

export type ProblemDetail = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type RegisterPayload = AuthCredentials & {
  name: string;
};

export type AuthSession = {
  token: string;
  account: Account;
};

export type ThemeMode = 'light' | 'dark';

export type QueryFilterWindow = 7 | 30 | 90;

export type QueryFilters = {
  endpoint?: QueryEndpoint;
  window?: QueryFilterWindow;
  search?: string;
  order?: 'newest' | 'oldest';
};

export type PaginatedQueries = {
  items: SatelliteQuery[];
  page: number;
  pageSize: number;
  total: number;
};

export function isNdviResult(result: NdviResult | LandUseResult): result is NdviResult {
  return 'ndvi' in result;
}

export function isLandUseResult(result: NdviResult | LandUseResult): result is LandUseResult {
  return 'vegetation' in result && 'urban' in result;
}

export type ApodPicture = {
  date: string;
  title: string;
  explanation: string;
  mediaType: 'image' | 'video';
  url: string;
  hdurl?: string;
  copyright?: string;
};

export type SpaceEventCategory = {
  id: string;
  title: string;
};

export type SpaceEventGeometry = {
  date: string;
  type: 'Point' | 'Polygon';
  coordinates: number[] | number[][];
};

export type SpaceEvent = {
  id: string;
  title: string;
  description?: string;
  link?: string;
  closed?: string;
  categories: SpaceEventCategory[];
  geometries: SpaceEventGeometry[];
};
