import axios from 'axios';
import { Coordinate, WeatherSnapshot } from '../types';

const weatherClient = axios.create({
  baseURL: 'https://api.open-meteo.com/v1',
  timeout: 8000,
});

type OpenMeteoResponse = {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
    time: string;
  };
};

export const SAO_PAULO: Coordinate = {
  lat: -23.5505,
  lng: -46.6333,
};

export async function getCurrentWeather(
  coordinate: Coordinate = SAO_PAULO,
): Promise<WeatherSnapshot> {
  const { data } = await weatherClient.get<OpenMeteoResponse>('/forecast', {
    params: {
      latitude: coordinate.lat,
      longitude: coordinate.lng,
      current: 'temperature_2m,relative_humidity_2m,weather_code',
    },
  });

  return {
    temperature: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    weatherCode: data.current.weather_code,
    fetchedAt: data.current.time,
  };
}

export function describeWeatherCode(code: number): string {
  if (code === 0) return 'Céu limpo';
  if (code <= 3) return 'Parcialmente nublado';
  if (code <= 48) return 'Nevoeiro';
  if (code <= 57) return 'Garoa';
  if (code <= 67) return 'Chuva';
  if (code <= 77) return 'Neve';
  if (code <= 82) return 'Pancadas de chuva';
  if (code <= 86) return 'Pancadas de neve';
  if (code <= 99) return 'Tempestade';
  return 'Indeterminado';
}

export function weatherIconName(code: number): string {
  if (code === 0) return 'sun';
  if (code <= 3) return 'cloud';
  if (code <= 48) return 'align-justify';
  if (code <= 67) return 'cloud-rain';
  if (code <= 77) return 'cloud-snow';
  if (code <= 82) return 'cloud-drizzle';
  if (code <= 99) return 'cloud-lightning';
  return 'help-circle';
}
