const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function postJSON<TResponse>(
  path: string,
  body: unknown
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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

  return response.json() as Promise<TResponse>;
}

