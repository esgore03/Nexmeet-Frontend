import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import chatIcon from "../assets/chat.png";
import participants_logo from "../assets/participants_logo.png";
import end_call from "../assets/end_call.webp";
import micro from "../assets/micro.png";
import camera from "../assets/camera.png";
import "../styles/meeting.scss";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
} from "../utils/socketManager";
import { request } from "../utils/request";

type Message = {
  userId: string;
  message: string;
  timestamp: string;
};

type UserWithSocketId = {
  userId: string;
  socketId: string;
  name?: string | null;
  email?: string | null;
  photoURL?: string | null;
};

const Meeting: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasJoinedRef = useRef(false); // ✅ Evitar doble join en Strict Mode

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [participants, setParticipants] = useState<UserWithSocketId[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const userEmail = localStorage.getItem("userEmail");
    const authToken = localStorage.getItem("authToken");

    console.log("🔍 DEBUG localStorage en Meeting:");
    console.log("  - userId:", userId);
    console.log("  - userEmail:", userEmail);
    console.log("  - authToken:", authToken ? "✅ Existe" : "❌ No existe");
    console.log("  - meetingId:", meetingId);

    if (!userId) {
      console.error("❌ No hay userId en localStorage");
      setError(
        "No se encontró información del usuario. Por favor, visita tu perfil primero.",
      );
      setTimeout(() => {
        const shouldGoToProfile = window.confirm(
          "No se encontró tu información de usuario. ¿Quieres ir a tu perfil para cargarla?",
        );
        if (shouldGoToProfile) {
          navigate("/profile");
        } else {
          navigate("/dashboard");
        }
      }, 1000);
      return;
    }

    setCurrentUserId(userId);

    if (!meetingId) {
      setError("ID de reunión no válido");
      navigate("/dashboard");
      return;
    }

    // ✅ Prevenir doble ejecución en React Strict Mode
    if (hasJoinedRef.current) {
      console.log("⚠️ Ya se ha unido a la reunión, evitando duplicado");
      return;
    }

    hasJoinedRef.current = true;
    console.log("📡 Conectando socket...");
    const socket = connectSocket();

    console.log(`🚪 Uniéndose a la reunión ${meetingId} con userId ${userId}`);
    socket.emit("newUser", userId, meetingId);

    // ✅ Limpiar listeners anteriores antes de agregar nuevos
    socket.off("usersOnline");
    socket.off("newMessage");
    socket.off("socketServerError");

    // Escuchar usuarios online
    socket.on(
      "usersOnline",
      (
        users: UserWithSocketId[],
        joiningUser: UserWithSocketId | null,
        leavingUser: UserWithSocketId | null,
      ) => {
        console.log("👥 Usuarios online:", users);
        console.log("  - Total participantes:", users.length);
        setParticipants(users);

        if (joiningUser) {
          console.log(
            `✅ ${joiningUser.name || joiningUser.email || "Usuario"} se unió a la reunión`,
          );
        }
        if (leavingUser) {
          console.log(
            `👋 ${leavingUser.name || leavingUser.email || "Usuario"} salió de la reunión`,
          );
        }
      },
    );

    // Escuchar nuevos mensajes
    socket.on("newMessage", (msg: Message) => {
      console.log("💬 Nuevo mensaje recibido:", msg);
      setMessages((prev) => {
        // ✅ Evitar duplicados comparando timestamp y userId
        const isDuplicate = prev.some(
          (m) =>
            m.timestamp === msg.timestamp &&
            m.userId === msg.userId &&
            m.message === msg.message,
        );
        if (isDuplicate) {
          console.log("⚠️ Mensaje duplicado detectado, ignorando");
          return prev;
        }
        return [...prev, msg];
      });
    });

    // Escuchar errores
    socket.on(
      "socketServerError",
      (errorData: { origin: string; message: string }) => {
        console.error("❌ Error del servidor:", errorData);
        setError(errorData.message);
      },
    );

    // Cleanup al desmontar
    return () => {
      console.log("🧹 Limpiando componente Meeting");
      hasJoinedRef.current = false; // ✅ Resetear flag
      socket.off("usersOnline");
      socket.off("newMessage");
      socket.off("socketServerError");
      disconnectSocket();
    };
  }, [meetingId, navigate]);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    const trimmed = messageInput.trim();
    if (!trimmed || !meetingId) {
      console.log("⚠️ Mensaje vacío o sin meetingId");
      return;
    }

    const socket = getSocket();
    const payload = {
      userId: currentUserId,
      message: trimmed,
      timestamp: new Date().toISOString(),
    };

    console.log("📤 Enviando mensaje:", payload);
    socket.emit("sendMessage", meetingId, payload);
    setMessageInput("");
  };

  const handleEndCall = async () => {
    try {
      if (!meetingId) return;

      console.log("🔚 Finalizando llamada...");
      disconnectSocket();

      await request({
        method: "PUT",
        endpoint: `/api/meetings/finish/${meetingId}`,
        headers: { "Content-Type": "application/json" },
      });

      console.log("✅ Llamada finalizada");
      navigate("/dashboard");
    } catch (error) {
      console.error("❌ Error finalizando la reunión:", error);
      navigate("/dashboard");
    }
  };

  const copyMeetingId = () => {
    if (meetingId) {
      navigator.clipboard.writeText(meetingId);
      alert("ID de reunión copiado al portapapeles");
    }
  };

  // ✅ Handlers separados para debugging
  const toggleChat = () => {
    console.log("🗨️ Toggling chat. Estado actual:", isChatOpen);
    setIsChatOpen(!isChatOpen);
    setIsParticipantsOpen(false); // ✅ Cerrar participantes al abrir chat
  };

  const toggleParticipants = () => {
    console.log("👥 Toggling participants. Estado actual:", isParticipantsOpen);
    setIsParticipantsOpen(!isParticipantsOpen);
    setIsChatOpen(false); // ✅ Cerrar chat al abrir participantes
  };

  return (
    <div className="video-call">
      <div className="video-container">
        <h1>Video Call</h1>

        <div className="meeting-id-display">
          <p>
            ID de la reunión: <strong>{meetingId}</strong>
          </p>
          <button onClick={copyMeetingId} className="copy-btn">
            Copiar ID
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}
      </div>

      {/* Controles centrales inferiores */}
      <div className="bottom-controls">
        <button
          className={`control-btn ${!isMicOn ? "disabled" : ""}`}
          onClick={() => setIsMicOn(!isMicOn)}
          title="Micrófono"
        >
          <img src={micro} alt="Micrófono" />
        </button>

        <button
          className="control-btn end-call"
          onClick={handleEndCall}
          title="Finalizar llamada"
        >
          <img src={end_call} alt="Finalizar llamada" />
        </button>

        <button
          className={`control-btn ${!isCameraOn ? "disabled" : ""}`}
          onClick={() => setIsCameraOn(!isCameraOn)}
          title="Cámara"
        >
          <img src={camera} alt="Cámara" />
        </button>
      </div>

      {/* Botones esquina inferior derecha */}
      <div className="side-controls">
        <button
          className="side-btn"
          onClick={toggleParticipants}
          title="Participantes"
        >
          <img src={participants_logo} alt="Participantes" />
          {participants.length > 0 && (
            <span className="badge">{participants.length}</span>
          )}
        </button>

        <button className="side-btn" onClick={toggleChat} title="Chat">
          <img src={chatIcon} alt="Chat" />
        </button>
      </div>

      {/* Panel de Chat */}
      <div className={`chat-panel ${isChatOpen ? "open" : ""}`}>
        <div className="panel-header">
          <h3>Chat</h3>
          <button className="close-btn" onClick={() => setIsChatOpen(false)}>
            ×
          </button>
        </div>
        <div className="messages-container">
          {messages.length === 0 ? (
            <p className="no-messages">No hay mensajes aún</p>
          ) : (
            messages.map((msg, index) => {
              const user = participants.find((p) => p.userId === msg.userId);
              const isCurrentUser = msg.userId === currentUserId;

              return (
                <div
                  key={`${msg.userId}-${msg.timestamp}-${index}`}
                  className={`message ${isCurrentUser ? "own-message" : ""}`}
                >
                  <div className="message-header">
                    <span className="message-author">
                      {isCurrentUser ? "Tú" : user?.name || "Usuario"}
                    </span>
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <span className="message-text">{msg.message}</span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-container">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Escribe un mensaje..."
            className="chat-input"
          />
          <button onClick={handleSendMessage} className="send-btn">
            Enviar
          </button>
        </div>
      </div>

      {/* Panel de Participantes */}
      <div className={`participants-panel ${isParticipantsOpen ? "open" : ""}`}>
        <div className="panel-header">
          <h3>Participantes ({participants.length})</h3>
          <button
            className="close-btn"
            onClick={() => setIsParticipantsOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="participants-content">
          <ul className="participants-list">
            {participants.map((user) => (
              <li key={user.socketId} className="participant-item">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.name || "Usuario"}
                    className="participant-avatar"
                  />
                )}
                <div className="participant-info">
                  <span className="participant-name">
                    {user.name || "Usuario"}
                    {user.userId === currentUserId && " (Tú)"}
                  </span>
                  {user.email && (
                    <span className="participant-email">{user.email}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Meeting;
