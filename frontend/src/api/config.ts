const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const WS_URL = `${wsProtocol}://${window.location.host}`;

export { API_URL, WS_URL };