/**
 * @fileoverview This module manages a singleton Socket.IO client connection.
 * It provides utility functions to initialize, connect, and disconnect a WebSocket
 * connection with proper configurations such as transport order and credentials.
 */

import { io, Socket } from "socket.io-client";

/**
 * Cached instance of the Socket.IO client to maintain a single connection.
 * @type {Socket | null}
 */
let socket: Socket | null = null;

/**
 * Retrieves the singleton instance of the Socket.IO client.
 * If no socket connection exists, a new one is created and configured.
 *
 * @function
 * @returns {Socket} The initialized Socket.IO client instance.
 *
 * @example
 * const socket = getSocket();
 * socket.emit("message", "Hello, server!");
 */
export const getSocket = (): Socket => {
  if (!socket) {
    console.log(
      "Creating new socket connection to:",
      import.meta.env.VITE_SOCKET_URL,
    );

    socket = io(import.meta.env.VITE_SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    // Debugging events
    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error.message);
      console.error("Details:", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
  }
  return socket;
};

/**
 * Establishes the socket connection if it is not already connected.
 *
 * @function
 * @returns {Socket} The connected Socket.IO client instance.
 *
 * @example
 * const socket = connectSocket();
 * // You can now listen or emit events.
 * socket.emit("joinRoom", { roomId: "12345" });
 */
export const connectSocket = (): Socket => {
  const socket = getSocket();
  if (!socket.connected) {
    console.log("Connecting socket...");
    socket.connect();
  }
  return socket;
};

/**
 * Disconnects the active socket connection and clears its reference.
 * If no socket is connected, the function does nothing.
 *
 * @function
 * @returns {void}
 *
 * @example
 * // Gracefully close the connection when leaving the page or component
 * disconnectSocket();
 */
export const disconnectSocket = (): void => {
  if (socket && socket.connected) {
    console.log("Disconnecting socket...");
    socket.disconnect();
    socket = null;
  }
};
