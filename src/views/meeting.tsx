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
import {
  initMeetVideo,
  connectToUserVideo,
  toggleCamera,
  leaveMeetVideo,
  getCameraState,
} from "../utils/video";

/**
 * Represents a chat message in the meeting
 */
type Message = {
  userId: string;
  message: string;
  timestamp: string;
};

/**
 * Represents a user in the meeting with their socket connection information
 */
type UserWithSocketId = {
  userId: string;
  socketId: string;
  name?: string | null;
  email?: string | null;
  photoURL?: string | null;
};

/**
 * Meeting component - Main component for video call meetings with chat, participants, audio and video functionality
 * @component
 * @returns {JSX.Element} The rendered Meeting component
 */
const Meeting: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasJoinedRef = useRef(false);
  const isCleaningUpRef = useRef(false);

  const audioInitializedRef = useRef(false);
  const connectedAudioPeersRef = useRef<Set<string>>(new Set());

  const videoInitializedRef = useRef(false);
  const connectedVideoPeersRef = useRef<Set<string>>(new Set());
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [participants, setParticipants] = useState<UserWithSocketId[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);

  const [meetingCreatorId, setMeetingCreatorId] = useState<string | null>(null);
  const [showEndMeetingConfirm, setShowEndMeetingConfirm] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showEndMeetingModal, setShowEndMeetingModal] = useState(false);
  const showingSummaryRef = useRef(false);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isAudioReady, setIsAudioReady] = useState(false);

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map(),
  );

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

    /**
     * Fetches meeting information from the backend
     */
    const fetchMeetingInfo = async () => {
      try {
        const meetingData = await request<{ userId: string }>({
          method: "GET",
          endpoint: `/api/meetings/${meetingId}`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (
          meetingData &&
          typeof meetingData === "object" &&
          "userId" in meetingData
        ) {
          setMeetingCreatorId(meetingData.userId || null);
          console.log("Creador de la reunión:", meetingData.userId);
        }
      } catch (error) {
        console.error("Error obteniendo info de la reunión:", error);
      }
    };

    fetchMeetingInfo();

    /**
     * Initializes the socket connection and registers the user in the meeting
     */
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

          setParticipants(users);

          if (joiningUser) {
            console.log(
              `${joiningUser.name || joiningUser.email || "Usuario"} se unió a la reunión`,
            );
          }
          if (leavingUser) {
            console.log(
              `${leavingUser.name || leavingUser.email || "Usuario"} salió de la reunión`,
            );

            setRemoteStreams((prev) => {
              const newMap = new Map(prev);
              newMap.delete(leavingUser.userId);
              return newMap;
            });
            connectedVideoPeersRef.current.delete(leavingUser.userId);
            connectedAudioPeersRef.current.delete(leavingUser.userId);
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

      socket.on("meetingEnded", () => {
        if (showingSummaryRef.current || currentUserId === meetingCreatorId) {
          console.log("Ignorando meetingEnded");
          return;
        }

        console.log("Cerrando vista de participante...");

        if (audioInitializedRef.current) {
          leaveMeetAudio();
          audioInitializedRef.current = false;
        }

        if (videoInitializedRef.current) {
          leaveMeetVideo();
          videoInitializedRef.current = false;
        }

        disconnectSocket();
        setShowEndMeetingModal(true);
      });

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
            console.error("Error en reconexión:", error);
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
        socket.off("meetingEnded");
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
        connectedAudioPeersRef.current.clear();
      }
    };
  }, [currentUserId, meetingId]);

  useEffect(() => {
    if (!currentUserId || !meetingId || videoInitializedRef.current) {
      return;
    }

    const initVideo = async () => {
      try {
        console.log("Inicializando sistema de video...");

        const stream = await initMeetVideo(
          meetingId,
          currentUserId,

          (userId: string, remoteStream: MediaStream) => {
            console.log("Stream remoto recibido de:", userId);
            setRemoteStreams((prev) => new Map(prev).set(userId, remoteStream));
          },

          (userId: string) => {
            console.log("Stream remoto removido de:", userId);
            setRemoteStreams((prev) => {
              const newMap = new Map(prev);
              newMap.delete(userId);
              return newMap;
            });
          },
        );

        setLocalStream(stream);
        videoInitializedRef.current = true;
        setIsVideoReady(true);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const camState = getCameraState();
        setIsCameraOn(camState);

        console.log("Video inicializado correctamente");
      } catch (error) {
        console.error("Error inicializando video:", error);
        setError("No se pudo acceder a la cámara. Verifica los permisos.");
      }
    };

    initVideo();

    return () => {
      if (videoInitializedRef.current) {
        console.log("Limpiando video...");
        leaveMeetVideo();
        videoInitializedRef.current = false;
        setIsVideoReady(false);
        setLocalStream(null);
        setRemoteStreams(new Map());
        connectedVideoPeersRef.current.clear();
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

      if (connectedAudioPeersRef.current.has(user.userId)) {
        console.log(`Ya conectado audio con ${user.name || user.userId}`);
        return;
      }

      console.log(`Conectando al audio de: ${user.name || user.userId}`);
      const call = connectToUserAudio(peerId, user.userId);

      if (call) {
        connectedAudioPeersRef.current.add(user.userId);
        console.log(
          `Conexión audio establecida con: ${user.name || user.userId}`,
        );
      }
    });

    const currentUserIds = new Set(participants.map((p) => p.userId));
    connectedAudioPeersRef.current.forEach((oduserId) => {
      if (!currentUserIds.has(oduserId)) {
        console.log(`Usuario ${oduserId} salió, limpiando conexión audio`);
        connectedAudioPeersRef.current.delete(oduserId);
      }
    });
  }, [participants, isAudioReady, meetingId, currentUserId]);

  useEffect(() => {
    if (!isVideoReady || !meetingId || !currentUserId) {
      return;
    }

    participants.forEach((user) => {
      if (user.userId === currentUserId) {
        return;
      }

      if (connectedVideoPeersRef.current.has(user.userId)) {
        console.log(`Ya conectado video con ${user.name || user.userId}`);
        return;
      }

      const peerId = `${meetingId}-${user.userId}`;
      console.log(`Conectando al video de: ${user.name || user.userId}`);

      const call = connectToUserVideo(peerId, user.userId);

      if (call) {
        connectedVideoPeersRef.current.add(user.userId);
        console.log(
          `Conexión video establecida con: ${user.name || user.userId}`,
        );
      }
    });

    const currentUserIds = new Set(participants.map((p) => p.userId));
    connectedVideoPeersRef.current.forEach((oduserId) => {
      if (!currentUserIds.has(oduserId)) {
        console.log(`Usuario ${oduserId} salió, limpiando conexión video`);
        connectedVideoPeersRef.current.delete(oduserId);
      }
    });
  }, [participants, isVideoReady, meetingId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  /**
   * Handles sending a chat message
   */
  const handleSendMessage = async () => {
    const trimmed = messageInput.trim();
    if (!trimmed) {
      console.log("Mensaje vacío");
      return;
    }

    const socket = getSocket();
    const authToken = localStorage.getItem("authToken");

    const currentUser = participants.find((p) => p.userId === currentUserId);
    const userName = currentUser?.name || currentUser?.email || "Usuario";

    const payload = {
      userId: currentUserId,
      message: trimmed,
      timestamp: new Date().toISOString(),
    };

    console.log("Enviando mensaje:", payload);

    socket.emit("sendMessage", payload);
    setMessageInput("");

    try {
      const response = await request({
        method: "PUT",
        endpoint: "/api/chats/saveMessage",
        data: {
          meetId: meetingId,
          message: {
            name: userName,
            message: trimmed,
            timestamp: payload.timestamp,
          },
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log("Mensaje guardado en BD:", response);
    } catch (error) {
      console.error("Error guardando mensaje:", error);
    }
  };

  /**
   * Handles leaving the call for the current user
   */
  const handleLeaveCall = async () => {
    try {
      if (!meetingId) return;

      console.log("Saliendo de la llamada...");

      const authToken = localStorage.getItem("authToken");
      const socket = getSocket();

      if (audioInitializedRef.current) {
        leaveMeetAudio();
        audioInitializedRef.current = false;
      }

      if (videoInitializedRef.current) {
        leaveMeetVideo();
        videoInitializedRef.current = false;
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

      console.log("Salida exitosa de la reunión");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saliendo de la reunión:", error);
      navigate("/dashboard");
    }
  };

  /**
   * Handles ending the meeting for all participants (host only)
   */
  const handleEndMeeting = async () => {
    try {
      if (!meetingId) return;

      console.log("Finalizando reunión...");

      const authToken = localStorage.getItem("authToken");
      const socket = getSocket();

      if (audioInitializedRef.current) {
        leaveMeetAudio();
        audioInitializedRef.current = false;
      }

      if (videoInitializedRef.current) {
        leaveMeetVideo();
        videoInitializedRef.current = false;
      }

      let summary = "No se pudo generar un resumen.";

      try {
        const response = await request<{ message: string; ai_summary: string }>(
          {
            method: "PUT",
            endpoint: `/api/meetings/finish/${meetingId}`,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          },
        );

        if (response?.ai_summary) {
          summary = response.ai_summary;
        }
      } catch (error) {
        console.error("Error obteniendo resumen:", error);
      }

      showingSummaryRef.current = true;

      socket.emit("endMeeting", meetingId);
      console.log("Notificación enviada");

      setAiSummary(summary);
      setShowSummaryModal(true);
      setShowEndMeetingConfirm(false);
    } catch (error) {
      console.error("Error crítico:", error);
      disconnectSocket();
      navigate("/dashboard");
    }
  };

  /**
   * Copies the meeting ID to the clipboard and shows a toast notification
   */
  const copyMeetingId = () => {
    if (meetingId) {
      navigator.clipboard.writeText(meetingId);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  /**
   * Toggles the microphone on/off state
   */
  const handleToggleMic = () => {
    if (!isAudioReady) {
      console.warn("Audio no está listo");
      return;
    }

    const newState = toggleMicrophone(isMicOn);
    setIsMicOn(newState);
    console.log(`Micrófono ${newState ? "activado" : "silenciado"}`);
  };

  /**
   * Toggles the camera on/off state
   */
  const handleToggleCamera = () => {
    if (!isVideoReady) {
      console.warn("Video no está listo");
      return;
    }

    const newState = toggleCamera(isCameraOn);
    setIsCameraOn(newState);
    console.log(`Cámara ${newState ? "activada" : "desactivada"}`);
  };

  /**
   * Toggles the chat panel visibility
   */
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    setIsParticipantsOpen(false);
  };

  /**
   * Toggles the participants panel visibility
   */
  const toggleParticipants = () => {
    setIsParticipantsOpen(!isParticipantsOpen);
    setIsChatOpen(false);
  };

  /**
   * Gets the name to display for a user
   */
  const getUserDisplayName = (oduserId: string): string => {
    const user = participants.find((p) => p.userId === oduserId);
    return user?.name || user?.email || "Usuario";
  };

  const isCreator = currentUserId === meetingCreatorId;

  /**
   * Gets the current user's initial letter
   */
  const getCurrentUserInitial = (): string => {
    const currentUser = participants.find((p) => p.userId === currentUserId);
    // Fallback to localStorage if not found in participants yet
    const displayName =
      currentUser?.name ||
      currentUser?.email ||
      localStorage.getItem("userEmail") ||
      "U";
    return displayName.charAt(0).toUpperCase();
  };
  return (
    <div className="video-call">
      {/* Video Grid Container */}
      <div className="video-grid-container">
        {/* Local Video */}
        <div
          className={`video-wrapper local-video-wrapper ${!isCameraOn ? "camera-off" : ""}`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="video-element local-video"
          />
          {!isCameraOn && (
            <div className="camera-off-placeholder">
              <div className="avatar-placeholder">
                {getCurrentUserInitial()}
              </div>
              <span>Cámara desactivada</span>
            </div>
          )}
          <div className="video-label">
            <span>Tú</span>
            {!isMicOn && <span className="mic-off-indicator">🔇</span>}
          </div>
        </div>

        {/* Remote Videos */}
        {Array.from(remoteStreams.entries()).map(([oduserId, stream]) => (
          <RemoteVideoElement
            key={oduserId}
            stream={stream}
            displayName={getUserDisplayName(oduserId)}
          />
        ))}

        {/* Empty slots for participants without video yet */}
        {participants
          .filter(
            (p) => p.userId !== currentUserId && !remoteStreams.has(p.userId),
          )
          .map((user) => (
            <div key={user.userId} className="video-wrapper connecting">
              <div className="camera-off-placeholder">
                <div className="avatar-placeholder">
                  {(user.name || user.email || "U").charAt(0).toUpperCase()}
                </div>
                <span>Conectando...</span>
              </div>
              <div className="video-label">
                <span>{user.name || user.email || "Usuario"}</span>
              </div>
            </div>
          ))}
      </div>

      {/* Meeting ID Display */}
      <div className="meeting-id-display">
        <p>
          ID: <strong>{meetingId}</strong>
        </p>
        <button onClick={copyMeetingId} className="copy-btn">
          Copiar
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {/* Toast Notifications */}
      {showToast && (
        <div className="toast-notification">
          <div className="toast-content">
            <span className="toast-icon">✓</span>
            <span className="toast-text">ID copiado al portapapeles</span>
          </div>
        </div>
      )}

      {showCopyToast && (
        <div className="toast-notification copy-toast">
          <div className="toast-content">
            <span className="toast-text">Resumen copiado al portapapeles</span>
          </div>
        </div>
      )}

      {/* End Meeting Confirmation Modal */}
      {showEndMeetingConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowEndMeetingConfirm(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>¿Finalizar reunión para todos?</h3>
            <p>Esta acción cerrará la reunión para todos los participantes.</p>
            <div className="modal-buttons">
              <button
                className="modal-btn cancel"
                onClick={() => setShowEndMeetingConfirm(false)}
              >
                Cancelar
              </button>
              <button className="modal-btn confirm" onClick={handleEndMeeting}>
                Finalizar para todos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="bottom-controls">
        <button
          className={`control-btn ${!isMicOn ? "disabled" : ""}`}
          onClick={handleToggleMic}
          title={isMicOn ? "Silenciar micrófono" : "Activar micrófono"}
          disabled={!isAudioReady}
        >
          <img src={micro} alt="Micrófono" />
          {!isMicOn && <div className="control-slash" />}
        </button>

        <button
          className={`control-btn ${!isCameraOn ? "disabled" : ""}`}
          onClick={handleToggleCamera}
          title={isCameraOn ? "Desactivar cámara" : "Activar cámara"}
          disabled={!isVideoReady}
        >
          <img src={camera} alt="Cámara" />
          {!isCameraOn && <div className="control-slash" />}
        </button>

        <button
          className="control-btn leave-call"
          onClick={handleLeaveCall}
          title="Salir de la llamada"
        >
          <img src={end_call} alt="Salir" />
        </button>

        {isCreator && (
          <button
            className="end-meeting-btn"
            onClick={() => setShowEndMeetingConfirm(true)}
            title="Finalizar reunión para todos"
          >
            <span className="end-text">Finalizar Reunión</span>
          </button>
        )}
      </div>

      {/* Side Controls */}
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

      {/* Chat Panel */}
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

      {/* Summary Modal */}
      {showSummaryModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowSummaryModal(false);
            showingSummaryRef.current = false;
            disconnectSocket();
            navigate("/dashboard");
          }}
        >
          <div
            className="modal-content summary-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Resumen de la Reunión</h3>
            <div className="summary-content">
              <pre>{aiSummary}</pre>
            </div>
            <div className="modal-buttons">
              <button
                className="modal-btn confirm"
                onClick={() => {
                  setShowSummaryModal(false);
                  disconnectSocket();
                  navigate("/dashboard");
                }}
              >
                Cerrar y volver al Dashboard
              </button>
              <button
                className="modal-btn secondary"
                onClick={() => {
                  navigator.clipboard.writeText(aiSummary);
                  setShowCopyToast(true);
                  setTimeout(() => setShowCopyToast(false), 3000);
                }}
              >
                Copiar resumen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Ended Modal (for non-hosts) */}
      {showEndMeetingModal && (
        <div className="modal-overlay end-meeting-overlay">
          <div className="modal-content end-meeting-modal">
            <div className="modal-icon">
              <span>📞</span>
            </div>
            <h3>Reunión Finalizada</h3>
            <p>El anfitrión ha finalizado esta reunión.</p>
            <p className="subtext">
              Serás redirigido al dashboard en un momento...
            </p>
            <div className="modal-buttons">
              <button
                className="modal-btn confirm"
                onClick={() => {
                  setShowEndMeetingModal(false);
                  navigate("/dashboard");
                }}
              >
                Ir al Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Participants Panel */}
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
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name || "Usuario"}
                    className="participant-avatar"
                  />
                ) : (
                  <div className="participant-avatar-placeholder">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="participant-info">
                  <span className="participant-name">
                    {user.name || "Usuario"}
                    {user.userId === currentUserId && " (Tú)"}
                    {user.userId === meetingCreatorId && " 👑"}
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

/**
 * Component to render a remote user's video stream
 */
interface RemoteVideoElementProps {
  stream: MediaStream;
  displayName: string;
}

const RemoteVideoElement: React.FC<RemoteVideoElementProps> = ({
  stream,
  displayName,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-wrapper remote-video-wrapper">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="video-element remote-video"
      />
      <div className="video-label">
        <span>{displayName}</span>
      </div>
    </div>
  );
};

export default Meeting;
