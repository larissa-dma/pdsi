const BASE = "/api";
let csrfToken: string | null = null;
let csrfHeaderName = "X-XSRF-TOKEN";
async function fetchCsrf(): Promise<void> {
  const res = await fetch(`${BASE}/csrf`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok)
    throw new Error(
      "Não foi possível obter o token de segurança. Verifique o backend.",
    );
  const data = await res.json();
  csrfToken = data.token;
  csrfHeaderName = data.headerName;
}
async function failure(res: Response): Promise<never> {
  const error = await res.json().catch(() => ({}));
  if (res.status === 401) window.dispatchEvent(new Event("oto:unauthorized"));
  throw Object.assign(
    new Error(
      error.erro ??
        error.message ??
        {
          401: "Sua sessão expirou. Entre novamente.",
          403: "Sem permissão ou sessão de segurança expirada.",
          404: "Registro não encontrado.",
          409: "Dados duplicados ou operação não permitida.",
        }[res.status] ??
        `Erro ${res.status}`,
    ),
    { status: res.status },
  );
}
async function response(
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> {
  if (method !== "GET" && !csrfToken) await fetchCsrf();
  const multipart = body instanceof FormData;
  const headers: Record<string, string> = {};
  if (body !== undefined && !multipart)
    headers["Content-Type"] = "application/json";
  if (method !== "GET" && csrfToken) headers[csrfHeaderName] = csrfToken;
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers,
    body:
      body === undefined ? undefined : multipart ? body : JSON.stringify(body),
  });
  if (!res.ok) return failure(res);
  return res;
}
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await response(method, path, body);
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}
export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  fetchCsrf,
  delete: (path: string) => request<void>("DELETE", path),
  async download(path: string, name: string) {
    const res = await response("GET", path);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
export interface Usuario {
  id: number;
  nome: string;
  identificador: string;
  perfil: "SECRETARIA" | "HOSPEDAGEM";
  estabelecimento_id: number | null;
  estabelecimento_nome?: string | null;
}
export async function login(
  identificador: string,
  password: string,
): Promise<void> {
  await fetchCsrf();
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      [csrfHeaderName]: csrfToken!,
    },
    body: new URLSearchParams({ identificador, password }),
  });
  if (!res.ok)
    throw new Error(
      res.status === 401
        ? "Identificador ou senha inválidos."
        : "Não foi possível entrar. Atualize a página e tente novamente.",
    );
  await fetchCsrf();
}
export async function logout(): Promise<void> {
  await api.post("/logout");
  csrfToken = null;
}
