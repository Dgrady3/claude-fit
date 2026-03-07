import toast from 'react-hot-toast';

const API_BASE = '/api/v1';

function getToken() {
  return localStorage.getItem('grokfit_token');
}

function setToken(token) {
  localStorage.setItem('grokfit_token', token);
}

function removeToken() {
  localStorage.removeItem('grokfit_token');
}

// Unwrap JSONAPI { data: { id, type, attributes } } into plain objects
function normalizeJsonApi(data) {
  if (!data || typeof data !== 'object') return data;

  // Single resource: { data: { id, type, attributes } }
  if (data.data && !Array.isArray(data.data) && data.data.attributes) {
    return { id: data.data.id, ...data.data.attributes };
  }

  // Collection: { data: [{ id, type, attributes }, ...] }
  if (data.data && Array.isArray(data.data)) {
    return data.data.map((item) => ({ id: item.id, ...item.attributes }));
  }

  // Already plain JSON (auth responses, etc.)
  return data;
}

async function request(method, path, { body, params, headers: extraHeaders } = {}) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extraHeaders,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url.toString(), config);
  } catch (err) {
    if (!navigator.onLine) {
      throw new Error('You appear to be offline');
    }
    throw new Error('Network error — check your connection');
  }

  if (response.status === 401) {
    removeToken();
    // Don't force redirect — let React auth context handle navigation
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Unauthorized');
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 403 && data.error === 'Demo mode is read-only') {
      toast.error('Demo mode is read-only');
    }
    const error = new Error(data.error || data.errors?.join(', ') || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return normalizeJsonApi(data);
}

export const api = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: (path) => request('DELETE', path),
  upload: async (path, formData) => {
    const token = getToken();
    const headers = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401) {
      removeToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error || 'Upload failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  },
  setToken,
  getToken,
  removeToken,
};
