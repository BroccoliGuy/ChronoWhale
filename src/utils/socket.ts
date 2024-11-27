import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001'; // Remplacez par l'URL du serveur une fois déployé.
export const socket = io(SOCKET_URL, { autoConnect: false });

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};
