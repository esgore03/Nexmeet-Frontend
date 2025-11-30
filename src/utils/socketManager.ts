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
 */
export const getSocket = (): Socket => {
  if (!socket) {
    const authToken = localStorage.getItem("authToken");

    console.log(
      "Creating new socket connection to:",
      import.meta.env.VITE_CHAT_SERVER_URL,
    );

    socket = io(import.meta.env.VITE_CHAT_SERVER_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: true,

      auth: {
        token: authToken,
      },

      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
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

    socket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
    });
  }
  return socket;
};

/**
 * Establishes the socket connection if it is not already connected.
 *
 * @function
 * @returns {Socket} The connected Socket.IO client instance.
 */
export const connectSocket = (): Socket => {
  const socket = getSocket();
  if (!socket.connected) {
    console.log("Connecting socket...");
    socket.connect();
  } else {
    console.log("Socket already connected:", socket.id);
  }
  return socket;
};

/**
 * Disconnects the active socket connection and clears its reference.

 *
 * @function
 * @returns {void}
 */
export const disconnectSocket = (): void => {
  if (socket) {
    console.log("Cleaning up socket...");

    socket.off("usersOnline");
    socket.off("newMessage");
    socket.off("socketServerError");

    if (socket.connected) {
      console.log("Disconnecting socket:", socket.id);
      socket.disconnect();
    }
  }
};

export const resetSocket = (): void => {
  if (socket) {
    console.log("Resetting socket completely...");
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
