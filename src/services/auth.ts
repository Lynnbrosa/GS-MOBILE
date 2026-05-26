import { Account, AuthSession, RegisterPayload } from '../types';
import { api } from './api';
import { mockAuth } from './mockApi';
import { setItem } from '../storage/asyncStorage';
import { StorageKeys } from '../storage/keys';

const useMock = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

type BackendAuthResponse = {
  accountId: string;
  email: string;
  apiKey?: string;
  token: string;
  expiresAt?: string;
};

type MeResponse = {
  accountId?: string;
  id?: string;
  email: string;
  name?: string;
};

function adaptAuthResponse(data: BackendAuthResponse, fallbackName?: string): AuthSession {
  return {
    token: data.token,
    account: {
      id: data.accountId,
      email: data.email,
      name: fallbackName ?? data.email.split('@')[0] ?? 'Operador',
    },
  };
}

export async function login(email: string, password: string): Promise<AuthSession> {
  if (useMock) {
    return mockAuth.login(email, password);
  }
  const { data } = await api.post<BackendAuthResponse>('/auth/login', { email, password });
  const session = adaptAuthResponse(data);
  await persistSession(session);
  // Best effort to refine name via /me.
  try {
    const me = await fetchMe();
    if (me.name) {
      session.account.name = me.name;
      await persistSession(session);
    }
  } catch {
    /* ignore */
  }
  return session;
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  if (useMock) {
    return mockAuth.register(payload);
  }
  const { data } = await api.post<BackendAuthResponse>('/auth/register', payload);
  const session = adaptAuthResponse(data, payload.name);
  await persistSession(session);
  return session;
}

async function fetchMe(): Promise<{ name?: string }> {
  const { data } = await api.get<MeResponse>('/me');
  return { name: data.name };
}

export async function me(): Promise<Account> {
  if (useMock) {
    return mockAuth.me();
  }
  const { data } = await api.get<MeResponse>('/me');
  return {
    id: data.accountId ?? data.id ?? '',
    email: data.email,
    name: data.name ?? data.email.split('@')[0] ?? 'Operador',
  };
}

async function persistSession(session: AuthSession): Promise<void> {
  await setItem(StorageKeys.token, session.token);
  await setItem(StorageKeys.account, session.account);
}
