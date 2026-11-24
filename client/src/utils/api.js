const BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://biodiversity-unig.onrender.com' : '');

export function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  if (path.startsWith('/uploads')) return `${BASE}${path}`;
  return path;
}

async function request(path, options = {}) {
  const token = localStorage.getItem('biodiversity_token') || localStorage.getItem('abraventure_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.error || err.message || 'Request failed');
  }
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData, method = 'POST') => {
    const token = localStorage.getItem('biodiversity_token') || localStorage.getItem('abraventure_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${BASE}${path}`, { method, body: formData, headers }).then(async (r) => {
      if (!r.ok) {
        const err = await r.json().catch(() => ({ message: r.statusText }));
        throw new Error(err.message || err.error || 'Upload request failed');
      }
      return r.json();
    });
  }
};
