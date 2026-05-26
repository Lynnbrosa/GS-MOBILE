import {
  Account,
  AuthSession,
  Coordinate,
  LandUseResult,
  NdviResult,
  ProblemDetail,
  RegisterPayload,
} from '../types';
import { ApiError } from './api';
import { setItem } from '../storage/asyncStorage';
import { StorageKeys } from '../storage/keys';

function delay<T>(value: T, ms = 400 + Math.random() * 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function problem(status: number, title: string, detail: string): ApiError {
  const payload: ProblemDetail = {
    type: 'about:blank',
    title,
    status,
    detail,
  };
  return new ApiError(payload);
}

function randomId(): string {
  return `mock-${Math.random().toString(36).slice(2, 10)}`;
}

const mockAccount: Account = {
  id: 'mock-account-1',
  email: 'demo@orbittapi.dev',
  name: 'Operador Demo',
};

async function persistMockSession(session: AuthSession): Promise<void> {
  await setItem(StorageKeys.token, session.token);
  await setItem(StorageKeys.account, session.account);
}

export const mockAuth = {
  async login(email: string, password: string): Promise<AuthSession> {
    await delay(null, 600);
    if (!email || !password) {
      throw problem(400, 'Credenciais inválidas', 'Informe e-mail e senha.');
    }
    const session: AuthSession = {
      token: `mock-token-${randomId()}`,
      account: { ...mockAccount, email },
    };
    await persistMockSession(session);
    return session;
  },
  async register(payload: RegisterPayload): Promise<AuthSession> {
    await delay(null, 700);
    if (!payload.email || !payload.password || !payload.name) {
      throw problem(400, 'Dados incompletos', 'Preencha nome, e-mail e senha.');
    }
    const session: AuthSession = {
      token: `mock-token-${randomId()}`,
      account: { ...mockAccount, email: payload.email, name: payload.name },
    };
    await persistMockSession(session);
    return session;
  },
  async me(): Promise<Account> {
    return delay(mockAccount, 200);
  },
};

function mockLandUse(): LandUseResult {
  const vegetation = 40 + Math.random() * 35;
  const urban = 10 + Math.random() * 25;
  const water = Math.random() * 15;
  const bareSoil = Math.max(0, 100 - vegetation - urban - water);
  return {
    vegetation: Number(vegetation.toFixed(1)),
    urban: Number(urban.toFixed(1)),
    water: Number(water.toFixed(1)),
    bareSoil: Number(bareSoil.toFixed(1)),
  };
}

function mockNdvi(): NdviResult {
  const sources: NdviResult['source'][] = ['Landsat', 'Sentinel-2'];
  const source = sources[Math.floor(Math.random() * sources.length)] ?? 'Sentinel-2';
  return {
    ndvi: Number((Math.random() * 1.4 - 0.2).toFixed(3)),
    capturedAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
    source,
  };
}

export const mockSatellite = {
  async getLandUse(_coordinate: Coordinate): Promise<LandUseResult> {
    return delay(mockLandUse(), 500);
  },
  async getVegetation(_coordinate: Coordinate): Promise<NdviResult> {
    return delay(mockNdvi(), 500);
  },
};
