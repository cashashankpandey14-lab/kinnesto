import Constants from 'expo-constants';
import { Platform } from 'react-native';

// EXPO_PUBLIC_API_URL wins (set it for production builds). In development we
// reach the API on the same machine that runs the Expo dev server, port 4100.
function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (Platform.OS === 'web') return 'http://localhost:4100';
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host || 'localhost'}:4100`;
}

export const API_URL = resolveBaseUrl();

let authToken: string | null = null;
export function setApiToken(token: string | null) {
  authToken = token;
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string, public feature?: string, public data?: any) {
    super(message);
  }
}

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.code, data.feature, data);
  return data as T;
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(`Can't reach the server at ${API_URL}`, 0);
  }
  return handle<T>(res);
}

export interface LocalFile {
  uri: string;
  name: string;
  type: string;
}

// Multipart upload that works on iOS/Android (uri objects) and web (Blobs).
export async function upload<T = any>(path: string, field: string, file: LocalFile, extra: Record<string, string> = {}): Promise<T> {
  const form = new FormData();
  for (const [k, v] of Object.entries(extra)) form.append(k, v);
  if (Platform.OS === 'web') {
    const blob = await (await fetch(file.uri)).blob();
    form.append(field, blob, file.name);
  } else {
    form.append(field, { uri: file.uri, name: file.name, type: file.type } as any);
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: form,
    });
  } catch {
    throw new ApiError(`Can't reach the server at ${API_URL}`, 0);
  }
  return handle<T>(res);
}
