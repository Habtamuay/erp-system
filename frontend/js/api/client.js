import { state } from '../state.js';

export async function apiRequest(url, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (_error) {
    data = null;
  }

  if (!response.ok) {
    const message = (data && data.error) || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}
