import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { getItem, removeItem } from '../storage/asyncStorage';
import { StorageKeys } from '../storage/keys';
import { ProblemDetail } from '../types';

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && fromEnv.trim().length > 0) {
    if (Platform.OS === 'android') {
      // Android emulator cannot reach the host's "localhost"; remap.
      return fromEnv
        .replace('://localhost', '://10.0.2.2')
        .replace('://127.0.0.1', '://10.0.2.2');
    }
    return fromEnv;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
}

const baseURL = resolveBaseUrl();

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getItem<string>(StorageKeys.token);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;
  readonly title: string;
  readonly type: string;

  constructor(problem: ProblemDetail) {
    super(problem.detail || problem.title);
    this.status = problem.status;
    this.detail = problem.detail;
    this.title = problem.title;
    this.type = problem.type;
  }
}

function parseProblemDetail(error: AxiosError): ApiError {
  const data = error.response?.data;
  const status = error.response?.status ?? 0;

  if (
    data &&
    typeof data === 'object' &&
    'title' in data &&
    'detail' in data
  ) {
    const problem = data as ProblemDetail;
    return new ApiError({
      type: problem.type ?? 'about:blank',
      title: problem.title,
      status: problem.status ?? status,
      detail: problem.detail,
      instance: problem.instance,
    });
  }

  if (error.code === 'ECONNABORTED') {
    return new ApiError({
      type: 'about:blank',
      title: 'Tempo esgotado',
      status: 408,
      detail: 'A requisição demorou demais para responder. Tente novamente.',
    });
  }

  if (!error.response) {
    return new ApiError({
      type: 'about:blank',
      title: 'Sem conexão',
      status: 0,
      detail: 'Não foi possível alcançar o servidor. Verifique sua conexão e o backend.',
    });
  }

  return new ApiError({
    type: 'about:blank',
    title: error.response.statusText || 'Erro',
    status,
    detail: error.message,
  });
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await removeItem(StorageKeys.token);
      await removeItem(StorageKeys.account);
      if (unauthorizedHandler) {
        unauthorizedHandler();
      }
    }
    return Promise.reject(parseProblemDetail(error));
  },
);

export { baseURL };
