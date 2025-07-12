const API_URL = import.meta.env.VITE_API_URL || '/api';

let WS_URL: string;

if (API_URL.startsWith('http')) {
  WS_URL = API_URL.replace(/^http/, 'ws');
} else {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  WS_URL = `${wsProtocol}://${window.location.host}`;
}

export { API_URL, WS_URL };