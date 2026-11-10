const BASE = '/api';

let csrfToken: string | null = null;
let csrfHeaderName: string | null = null;

async function fetchCsrf(): Promise<void> {
  const res = await fetch(`${BASE}/csrf`, { credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao buscar CSRF');
  const data = await res.json();
  csrfToken = data.token;
  csrfHeaderName = data.headerName;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  if (method !== 'GET' && !csrfToken) await fetchCsrf();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (method !== 'GET' && csrfToken && csrfHeaderName) {
    headers[csrfHeaderName] = csrfToken;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message ?? res.statusText), { status: res.status });
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  fetchCsrf,
};

export interface Usuario {
  id: number;
  nome: string;
  identificador: string;
  perfil: 'SECRETARIA' | 'HOSPEDAGEM';
  estabelecimento_id: number | null;
}

export async function login(identificador: string, password: string): Promise<void> {
  await fetchCsrf();
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (csrfToken && csrfHeaderName) headers[csrfHeaderName] = csrfToken;

  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: new URLSearchParams({ identificador, password }),
  });

  if (!res.ok) {
    const status = res.status;
    if (status === 401) throw new Error('Identificador ou senha inválidos.');
    throw new Error('Não foi possível entrar.');
  }

  // Renova CSRF após login (Spring Security troca o token)
  await fetchCsrf();
}

export async function logout(): Promise<void> {
  await request<void>('POST', '/logout');
  csrfToken = null;
  csrfHeaderName = null;
}
