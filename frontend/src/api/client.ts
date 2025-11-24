const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type RequestOptions = {
  token?: string;
};

export async function postJSON<TResponse>(
  path: string,
  body: unknown,
  options?: RequestOptions
): Promise<TResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

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

