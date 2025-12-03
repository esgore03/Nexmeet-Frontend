import { io, Socket } from "socket.io-client";
/**
 * Socket.IO client instance singleton
 * @type {Socket | null}
 */
let socket: Socket | null = null;
/**
 * Gets the socket instance, creating it if it doesn't exist
 * Configures socket with connection options, event listeners, and reconnection logic
 * @function getSocket
 * @returns {Socket} The Socket.IO client instance
 */
export const getSocket = (): Socket => {
  if (!socket) {
    console.log(
      "Creating new socket connection to:",
      import.meta.env.VITE_CHAT_SERVER_URL,
    );

    socket = io(import.meta.env.VITE_CHAT_SERVER_URL, {
      autoConnect: false,
      transports: ["polling", "websocket"],
      withCredentials: false,

      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
    });

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

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("Reconnection attempt:", attemptNumber);
    });

    socket.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error.message);
    });

    socket.on("reconnect_failed", () => {
      console.error("Reconnection failed after all attempts");
    });
  }
  return socket;
};
/**
 * Connects the socket if not already connected
 * Gets or creates the socket instance and initiates connection
 * @function connectSocket
 * @returns {Socket} The connected Socket.IO client instance
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
 * Disconnects the socket and removes specific event listeners
 * Cleans up listeners for usersOnline, newMessage, and chatServerError events
 * @function disconnectSocket
 * @returns {void}
 */
export const disconnectSocket = (): void => {
  if (socket) {
    console.log("Cleaning up socket...");

    socket.off("usersOnline");
    socket.off("newMessage");
    socket.off("chatServerError");

    if (socket.connected) {
      console.log("Disconnecting socket:", socket.id);
      socket.disconnect();
    }
  }
};
/**
 * Completely resets the socket instance
 * Removes all listeners, disconnects the socket, and sets the instance to null
 * @function resetSocket
 * @returns {void}
 */
export const resetSocket = (): void => {
  if (socket) {
    console.log("Resetting socket completely...");
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
