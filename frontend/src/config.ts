const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const API_BASE_URL = String(rawApiBaseUrl).replace(/\/$/, '');

const inferredWsUrl = API_BASE_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') + '/ws';

export const WS_BASE_URL = String(import.meta.env.VITE_WS_BASE_URL ?? inferredWsUrl).replace(/\/$/, '');
