import { io } from 'socket.io-client';

const defaultHost = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL && !import.meta.env.VITE_SOCKET_URL.includes('localhost'))
  ? import.meta.env.VITE_SOCKET_URL
  : `http://${defaultHost}:5000`;

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
