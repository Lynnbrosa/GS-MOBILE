import {
  Coordinate,
  LandUseResult,
  NdviResult,
  PaginatedQueries,
  QueryEndpoint,
  QueryFilters,
  SatelliteQuery,
  SatelliteSource,
} from '../types';
import { api } from './api';
import { mockSatellite } from './mockApi';
import { getItem, setItem } from '../storage/asyncStorage';
import { StorageKeys } from '../storage/keys';

const useMock = process.env.EXPO_PUBLIC_USE_MOCK === 'true';
const MAX_HISTORY = 200;

type BackendLandUseResponse = {
  latitude: number;
  longitude: number;
  vegetationPercent: number;
  urbanPercent: number;
  waterPercent: number;
  bareSoilPercent: number;
  imageDate: string;
  source: string;
  cacheHit: boolean;
};

type BackendVegetationResponse = {
  latitude: number;
  longitude: number;
  ndvi: number;
  health: string;
  imageDate: string;
  source: string;
  cacheHit: boolean;
};

function adaptSource(raw: string): SatelliteSource {
  return raw === 'Landsat' ? 'Landsat' : 'Sentinel-2';
}

function toIsoCapture(imageDate: string): string {
  if (imageDate.includes('T')) return imageDate;
  return new Date(`${imageDate}T00:00:00Z`).toISOString();
}

export async function getLandUse(coordinate: Coordinate): Promise<LandUseResult> {
  let result: LandUseResult;
  if (useMock) {
    result = await mockSatellite.getLandUse(coordinate);
  } else {
    const { data } = await api.get<BackendLandUseResponse>('/landuse', {
      params: { lat: coordinate.lat, lng: coordinate.lng },
    });
    result = {
      vegetation: data.vegetationPercent,
      urban: data.urbanPercent,
      water: data.waterPercent,
      bareSoil: data.bareSoilPercent,
    };
  }
  await recordQuery({
    coordinate,
    endpoint: 'landuse',
    result,
  });
  return result;
}

export async function getVegetation(coordinate: Coordinate): Promise<NdviResult> {
  let result: NdviResult;
  if (useMock) {
    result = await mockSatellite.getVegetation(coordinate);
  } else {
    const { data } = await api.get<BackendVegetationResponse>('/vegetation', {
      params: { lat: coordinate.lat, lng: coordinate.lng },
    });
    result = {
      ndvi: data.ndvi,
      capturedAt: toIsoCapture(data.imageDate),
      source: adaptSource(data.source),
    };
  }
  await recordQuery({
    coordinate,
    endpoint: 'vegetation',
    result,
  });
  return result;
}

export async function getQueries(
  page = 1,
  pageSize = 20,
  filters: QueryFilters = {},
): Promise<PaginatedQueries> {
  const stored = (await getItem<SatelliteQuery[]>(StorageKeys.queries)) ?? [];
  let items = [...stored];

  if (filters.endpoint) {
    items = items.filter((q) => q.endpoint === filters.endpoint);
  }
  if (filters.window) {
    const cutoff = Date.now() - filters.window * 86400000;
    items = items.filter((q) => new Date(q.executedAt).getTime() >= cutoff);
  }
  if (filters.search) {
    const needle = filters.search.toLowerCase();
    items = items.filter((q) =>
      `${q.coordinate.lat.toFixed(4)},${q.coordinate.lng.toFixed(4)}`
        .toLowerCase()
        .includes(needle),
    );
  }

  items.sort((a, b) => {
    const diff = new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime();
    return filters.order === 'oldest' ? -diff : diff;
  });

  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
  };
}

export async function getQueryById(id: string): Promise<SatelliteQuery | null> {
  const stored = (await getItem<SatelliteQuery[]>(StorageKeys.queries)) ?? [];
  return stored.find((q) => q.id === id) ?? null;
}

export async function clearQueryHistory(): Promise<void> {
  await setItem(StorageKeys.queries, []);
}

type RecordInput = {
  coordinate: Coordinate;
  endpoint: QueryEndpoint;
  result: LandUseResult | NdviResult;
};

async function recordQuery(input: RecordInput): Promise<SatelliteQuery> {
  const entry: SatelliteQuery = {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    coordinate: input.coordinate,
    endpoint: input.endpoint,
    result: input.result,
    executedAt: new Date().toISOString(),
  };
  const stored = (await getItem<SatelliteQuery[]>(StorageKeys.queries)) ?? [];
  const next = [entry, ...stored].slice(0, MAX_HISTORY);
  await setItem(StorageKeys.queries, next);
  return entry;
}
