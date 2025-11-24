const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type RequestOptions = {
  token?: string;
  method?: string;
  body?: unknown;
};

async function request<TResponse>(
  path: string,
  { token, method = 'GET', body }: RequestOptions = {}
): Promise<TResponse> {
  const headers: Record<string, string> = {};
  const init: RequestInit = { method, headers };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    let message = response.statusText;
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.error === 'string') {
        message = errorBody.error;
      }
    } catch {
      // ignore JSON parse errors and use status text
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

export function getJSON<TResponse>(
  path: string,
  options?: Omit<RequestOptions, 'method' | 'body'>
) {
  return request<TResponse>(path, { ...options, method: 'GET' });
}

export function postJSON<TResponse>(
  path: string,
  body: unknown,
  options?: Omit<RequestOptions, 'method' | 'body'>
) {
  return request<TResponse>(path, { ...options, method: 'POST', body });
}

export function patchJSON<TResponse>(
  path: string,
  body: unknown,
  options?: Omit<RequestOptions, 'method' | 'body'>
) {
  return request<TResponse>(path, { ...options, method: 'PATCH', body });
}

