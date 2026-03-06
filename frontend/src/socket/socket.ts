import { io, Socket } from 'socket.io-client'

// Use explicit URL if set; otherwise same-origin in browser, localhost in dev
const SOCKET_URL =
  import.meta.env.VITE_SERVER_URL && String(import.meta.env.VITE_SERVER_URL).trim()
    ? String(import.meta.env.VITE_SERVER_URL)
    : typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
  }
  return socket
}

export function connect(): void {
  getSocket().connect()
}

export function disconnect(): void {
  if (socket) {
    socket.disconnect()
  }
}
