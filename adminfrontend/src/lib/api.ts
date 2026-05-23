const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestOptions extends RequestInit {
  token?: string;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, headers, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: requestHeaders,
  });

  if (!response.ok) {
    let message = `HTTP error ${response.status}`;
    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch {
      // ignore parse error
    }

    if (response.status === 401 && token && typeof window !== 'undefined') {
      const { useAuthStore } = await import('@/store/authStore');
      useAuthStore.getState().clearAuth();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    throw new ApiError(message, response.status);
  }

  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return response.text() as unknown as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string, token?: string) =>
    apiFetch<T>(endpoint, { method: 'GET', token }),

  post: <T>(endpoint: string, body: unknown, token?: string) =>
    apiFetch<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      token,
    }),

  patch: <T>(endpoint: string, body: unknown, token?: string) =>
    apiFetch<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      token,
    }),

  put: <T>(endpoint: string, body: unknown, token?: string) =>
    apiFetch<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      token,
    }),

  delete: <T>(endpoint: string, token?: string) =>
    apiFetch<T>(endpoint, { method: 'DELETE', token }),

  uploadForm: async <T>(
    endpoint: string,
    formData: FormData,
    token?: string
  ): Promise<T> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      let message = `HTTP error ${response.status}`;
      try {
        const data = await response.json();
        message = data.message || data.error || message;
      } catch {
        // ignore
      }

      if (response.status === 401 && token && typeof window !== 'undefined') {
        const { useAuthStore } = await import('@/store/authStore');
        useAuthStore.getState().clearAuth();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }

      throw new ApiError(message, response.status);
    }
    return response.json() as Promise<T>;
  },
};

export { ApiError };
