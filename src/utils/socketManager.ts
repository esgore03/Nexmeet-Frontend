import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

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

export const resetSocket = (): void => {
  if (socket) {
    console.log("Resetting socket completely...");
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
