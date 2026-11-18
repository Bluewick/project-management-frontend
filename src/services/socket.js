import { io } from 'socket.io-client';
import { API_URL, tokenStorage } from './api.js';

let socketInstance = null;

/**
 * Return the singleton Socket.IO client configured with the current JWT access token.
 */
export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(API_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: {
        token: tokenStorage.getAccessToken() || '',
      },
    });
  }
  return socketInstance;
}

/**
 * Connect (or update auth token and connect) when a user is authenticated.
 */
export function connectSocket() {
  const token = tokenStorage.getAccessToken();
  if (!token) return null;

  const socket = getSocket();
  socket.auth = { token };

  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

/**
 * Re-authenticate an active Socket.IO connection after token rotation.
 */
export function refreshSocketAuth() {
  if (!socketInstance) return;
  const token = tokenStorage.getAccessToken();
  if (!token) {
    disconnectSocket();
    return;
  }
  socketInstance.auth = { token };
  if (socketInstance.connected) {
    socketInstance.disconnect().connect();
  }
}

/**
 * Cleanly disconnect the Socket.IO client on logout or session expiry.
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
  }
}
