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
import {
  initMeetAudio,
  connectToUserAudio,
  toggleMicrophone,
  leaveMeetAudio,
  getMicrophoneState,
} from "../utils/audio";

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
  const hasJoinedRef = useRef(false);
  const isCleaningUpRef = useRef(false);
  const audioInitializedRef = useRef(false);
  const connectedPeersRef = useRef<Set<string>>(new Set());

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [participants, setParticipants] = useState<UserWithSocketId[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const userEmail = localStorage.getItem("userEmail");
    const authToken = localStorage.getItem("authToken");

    console.log("DEBUG localStorage en Meeting:");
    console.log("  - userId:", userId);
    console.log("  - userEmail:", userEmail);
    console.log("  - authToken:", authToken ? "Existe" : "No existe");
    console.log("  - meetingId:", meetingId);

    if (!userId) {
      console.error("No hay userId en localStorage");
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

    if (!authToken) {
      console.error("No hay authToken en localStorage");
      setError(
        "No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.",
      );
      navigate("/login");
      return;
    }

    setCurrentUserId(userId);

    if (!meetingId) {
      setError("ID de reunión no válido");
      navigate("/dashboard");
      return;
    }

    if (hasJoinedRef.current) {
      console.log("Ya se ha unido a la reunión, evitando duplicado");
      return;
    }

    const initializeSocketConnection = async () => {
      hasJoinedRef.current = true;
      console.log("Conectando socket...");
      const socket = connectSocket();

      if (!socket.connected) {
        await new Promise<void>((resolve) => {
          socket.once("connect", () => {
            console.log("Socket conectado:", socket.id);
            resolve();
          });
        });
      }

      console.log(`Uniéndose a la reunión ${meetingId} con userId ${userId}`);

      try {
        const response = await request<UserWithSocketId[]>({
          method: "PUT",
          endpoint: `/api/meetings/updateOrAddMeetingUser/${meetingId}`,
          data: { userId, socketId: socket.id },
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });

        console.log("Usuario registrado en el backend:", response);

        if (Array.isArray(response)) {
          setParticipants(response);
        }

        socket.emit("newUser", authToken, userId, meetingId);
      } catch (error) {
        console.error("Error registrando usuario en backend:", error);
        setError("No se pudo unir a la reunión. Intenta nuevamente.");
        return;
      }

      socket.on(
        "usersOnline",
        (
          users: UserWithSocketId[],
          joiningUser: UserWithSocketId | null,
          leavingUser: UserWithSocketId | null,
        ) => {
          console.log("Usuarios online:", users);
          console.log("  - Total participantes:", users.length);
          console.log(
            "  - Lista completa:",
            users.map((u) => ({
              userId: u.userId,
              name: u.name,
              socketId: u.socketId,
            })),
          );

          setParticipants(users);

          if (joiningUser) {
            console.log(
              ` ${joiningUser.name || joiningUser.email || "Usuario"} se unió a la reunión`,
            );
          }
          if (leavingUser) {
            console.log(
              ` ${leavingUser.name || leavingUser.email || "Usuario"} salió de la reunión`,
            );
          }
        },
      );

      socket.on("newMessage", (msg: Message) => {
        console.log("Nuevo mensaje recibido:", msg);
        setMessages((prev) => {
          const isDuplicate = prev.some(
            (m) =>
              m.timestamp === msg.timestamp &&
              m.userId === msg.userId &&
              m.message === msg.message,
          );
          if (isDuplicate) {
            console.log("Mensaje duplicado detectado, ignorando");
            return prev;
          }
          return [...prev, msg];
        });
      });

      socket.on(
        "chatServerError",
        (errorData: { origin: string; message: string }) => {
          console.error("Error del servidor de chat:", errorData);
          setError(errorData.message);
        },
      );

      console.log("Verificando listeners registrados:");
      console.log("  - newMessage:", socket.listeners("newMessage").length);
      console.log("  - usersOnline:", socket.listeners("usersOnline").length);
      console.log(
        "  - chatServerError:",
        socket.listeners("chatServerError").length,
      );

      socket.on("connect", async () => {
        console.log("Socket reconectado, volviendo a unirse a la reunión");
        if (hasJoinedRef.current && meetingId && userId && authToken) {
          try {
            const response = await request({
              method: "PUT",
              endpoint: `/api/meetings/updateOrAddMeetingUser/${meetingId}`,
              data: { userId, socketId: socket.id },
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
            });

            if (Array.isArray(response)) {
              setParticipants(response);
            }

            socket.emit("newUser", authToken, userId, meetingId);
          } catch (error) {
            console.error("❌ Error en reconexión:", error);
          }
        }
      });
    };

    initializeSocketConnection();

    return () => {
      if (isCleaningUpRef.current) {
        console.log("Ya se está limpiando, evitando duplicado");
        return;
      }

      console.log("Limpiando componente Meeting");
      isCleaningUpRef.current = true;
      hasJoinedRef.current = false;

      const socket = getSocket();
      if (socket) {
        socket.off("usersOnline");
        socket.off("newMessage");
        socket.off("chatServerError");
        socket.off("connect");
      }

      setTimeout(() => {
        isCleaningUpRef.current = false;
      }, 100);
    };
  }, [meetingId, navigate]);

  useEffect(() => {
    if (!currentUserId || !meetingId || audioInitializedRef.current) {
      return;
    }

    const initAudio = async () => {
      try {
        console.log("Inicializando sistema de audio...");
        await initMeetAudio(meetingId, currentUserId);
        audioInitializedRef.current = true;
        setIsAudioReady(true);
        console.log("Audio inicializado correctamente");

        // Sincronizar estado del micrófono
        const micState = getMicrophoneState();
        setIsMicOn(micState);
      } catch (error) {
        console.error("Error inicializando audio:", error);
        setError(
          "No se pudo inicializar el audio. Verifica los permisos del micrófono.",
        );
      }
    };

    initAudio();

    return () => {
      if (audioInitializedRef.current) {
        console.log("Limpiando audio...");
        leaveMeetAudio();
        audioInitializedRef.current = false;
        setIsAudioReady(false);
        connectedPeersRef.current.clear();
      }
    };
  }, [currentUserId, meetingId]);

  useEffect(() => {
    if (!isAudioReady || !meetingId || !currentUserId) {
      return;
    }

    participants.forEach((user) => {
      if (user.userId === currentUserId) {
        return;
      }

      const peerId = `${meetingId}-${user.userId}`;

      if (connectedPeersRef.current.has(user.userId)) {
        console.log(`Ya conectado con ${user.name || user.userId}`);
        return;
      }

      console.log(`Conectando al audio de: ${user.name || user.userId}`);
      const call = connectToUserAudio(peerId, user.userId);

      if (call) {
        connectedPeersRef.current.add(user.userId);
        console.log(`Conexión establecida con: ${user.name || user.userId}`);
      }
    });

    const currentUserIds = new Set(participants.map((p) => p.userId));
    connectedPeersRef.current.forEach((userId) => {
      if (!currentUserIds.has(userId)) {
        console.log(`Usuario ${userId} salió, limpiando conexión`);
        connectedPeersRef.current.delete(userId);
      }
    });
  }, [participants, isAudioReady, meetingId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    const trimmed = messageInput.trim();
    if (!trimmed) {
      console.log("Mensaje vacío");
      return;
    }

    const socket = getSocket();
    const payload = {
      userId: currentUserId,
      message: trimmed,
      timestamp: new Date().toISOString(),
    };

    console.log("Enviando mensaje:", payload);
    socket.emit("sendMessage", payload);
    setMessageInput("");
  };

  const handleEndCall = async () => {
    try {
      if (!meetingId) return;

      console.log("Finalizando llamada...");

      const authToken = localStorage.getItem("authToken");
      const socket = getSocket();

      if (audioInitializedRef.current) {
        leaveMeetAudio();
        audioInitializedRef.current = false;
      }

      try {
        await request({
          method: "PUT",
          endpoint: `/api/meetings/removeUser/${meetingId}`,
          data: { userId: currentUserId, socketId: socket.id },
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });
        console.log("Usuario removido de la reunión");
      } catch (error) {
        console.error("Error removiendo usuario:", error);
      }

      disconnectSocket();

      //Solo finalizar la reunión si eres el host/último usuario
      // await request({
      //   method: "PUT",
      //   endpoint: `/api/meetings/finish/${meetingId}`,
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${authToken}`,
      //   },
      // });

      console.log("Salida exitosa de la reunión");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saliendo de la reunión:", error);

      navigate("/dashboard");
    }
  };

  const copyMeetingId = () => {
    if (meetingId) {
      navigator.clipboard.writeText(meetingId);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleToggleMic = () => {
    if (!isAudioReady) {
      console.warn("Audio no está listo");
      return;
    }

    const newState = toggleMicrophone(isMicOn);
    setIsMicOn(newState);
    console.log(` Micrófono ${newState ? "activado" : "silenciado"}`);
  };

  const handleToggleCamera = () => {
    setIsCameraOn(!isCameraOn);
    console.log(`Cámara ${!isCameraOn ? "activada" : "desactivada"}`);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    setIsParticipantsOpen(false);
  };

  const toggleParticipants = () => {
    setIsParticipantsOpen(!isParticipantsOpen);
    setIsChatOpen(false);
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

      {showToast && (
        <div className="toast-notification">
          <div className="toast-content">
            <span className="toast-icon">✓</span>
            <span className="toast-text">ID copiado al portapapeles</span>
          </div>
        </div>
      )}

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
