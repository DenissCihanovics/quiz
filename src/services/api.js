const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text}`);
  }

  return response.json();
};

export const apiGet = (path) => request(path);
export const apiPost = (path, body) =>
  request(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPatch = (path, body = {}) =>
  request(path, { method: 'PATCH', body: JSON.stringify(body) });
export const apiDelete = (path) =>
  request(path, { method: 'DELETE' });
