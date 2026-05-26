import axios from 'axios';
import { ApodPicture, SpaceEvent } from '../types';

const nasaKey = process.env.EXPO_PUBLIC_NASA_KEY ?? 'DEMO_KEY';

const apodClient = axios.create({
  baseURL: 'https://api.nasa.gov',
  timeout: 10000,
});

const eonetClient = axios.create({
  baseURL: 'https://eonet.gsfc.nasa.gov/api/v3',
  timeout: 10000,
});

type ApodResponse = {
  date: string;
  title: string;
  explanation: string;
  media_type: string;
  url: string;
  hdurl?: string;
  copyright?: string;
};

export async function getApod(): Promise<ApodPicture> {
  const { data } = await apodClient.get<ApodResponse>('/planetary/apod', {
    params: { api_key: nasaKey },
  });
  return {
    date: data.date,
    title: data.title,
    explanation: data.explanation,
    mediaType: data.media_type === 'video' ? 'video' : 'image',
    url: data.url,
    hdurl: data.hdurl,
    copyright: data.copyright,
  };
}

type EonetEventResponse = {
  events: Array<{
    id: string;
    title: string;
    description?: string;
    link?: string;
    closed?: string | null;
    categories: Array<{ id: string | number; title: string }>;
    geometry: Array<{
      date: string;
      type: 'Point' | 'Polygon';
      coordinates: number[] | number[][];
    }>;
  }>;
};

export async function getActiveSpaceEvents(limit = 20): Promise<SpaceEvent[]> {
  const { data } = await eonetClient.get<EonetEventResponse>('/events', {
    params: { status: 'open', limit },
  });
  return data.events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    link: event.link,
    closed: event.closed ?? undefined,
    categories: event.categories.map((c) => ({ id: String(c.id), title: c.title })),
    geometries: event.geometry.map((g) => ({
      date: g.date,
      type: g.type,
      coordinates: g.coordinates,
    })),
  }));
}

export function categoryIcon(categoryId: string): string {
  switch (categoryId) {
    case 'wildfires':
      return 'alert-triangle';
    case 'severeStorms':
      return 'wind';
    case 'volcanoes':
      return 'triangle';
    case 'seaLakeIce':
      return 'cloud-snow';
    case 'earthquakes':
      return 'activity';
    case 'floods':
      return 'cloud-rain';
    case 'drought':
      return 'sun';
    case 'dustHaze':
      return 'cloud';
    case 'landslides':
      return 'arrow-down-right';
    case 'manmade':
      return 'tool';
    case 'snow':
      return 'cloud-snow';
    case 'tempExtremes':
      return 'thermometer';
    case 'waterColor':
      return 'droplet';
    default:
      return 'globe';
  }
}

export function categoryLabelPt(categoryId: string, fallback: string): string {
  switch (categoryId) {
    case 'wildfires':
      return 'Queimadas';
    case 'severeStorms':
      return 'Tempestades severas';
    case 'volcanoes':
      return 'Vulcões';
    case 'seaLakeIce':
      return 'Gelo marítimo';
    case 'earthquakes':
      return 'Terremotos';
    case 'floods':
      return 'Enchentes';
    case 'drought':
      return 'Secas';
    case 'dustHaze':
      return 'Poeira e neblina';
    case 'landslides':
      return 'Deslizamentos';
    case 'manmade':
      return 'Origem humana';
    case 'snow':
      return 'Neve';
    case 'tempExtremes':
      return 'Temperaturas extremas';
    case 'waterColor':
      return 'Coloração da água';
    default:
      return fallback;
  }
}
