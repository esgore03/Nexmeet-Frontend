import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    console.log(
      "🔌 Creating new socket connection to:",
      import.meta.env.VITE_SOCKET_URL,
    );

    socket = io(import.meta.env.VITE_SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"], // ✅ Orden de transporte
      withCredentials: true, // ✅ Para CORS
    });

    // ✅ Eventos de debugging
    socket.on("connect", () => {
      console.log("✅ Socket conectado:", socket?.id);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Error de conexión Socket.IO:", error.message);
      console.error("Detalles:", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket desconectado:", reason);
    });
  }
  return socket;
};

export const connectSocket = () => {
  const socket = getSocket();
  if (!socket.connected) {
    console.log("📡 Conectando socket...");
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    console.log("🔌 Desconectando socket...");
    socket.disconnect();
    socket = null; // ✅ Limpiar referencia
  }
};
