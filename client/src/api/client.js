const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

let tokenGetter = null;

export function setTokenGetter(fn) {
  tokenGetter = fn;
}

export async function apiRequest(endpoint, { method = 'GET', body = null, headers = {} } = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('[API Auth] Failed to get auth token:', e);
    }
  }

  const options = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    if (body instanceof FormData) {
      delete requestHeaders['Content-Type'];
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }
  }

  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.errors = data.errors;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body }),
  patch: (endpoint, body) => apiRequest(endpoint, { method: 'PATCH', body }),
  del: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};

