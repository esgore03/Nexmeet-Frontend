import Peer from "peerjs";

const peerServerUrl = import.meta.env.VITE_AUDIO_SERVER_URL || "localhost:3001";

let peer: Peer | null = null;
let localStream: MediaStream | null = null;
let activeCalls: Map<string, Peer.MediaConnection> = new Map(); // { userId: call }

/**
 * Inicializa audio para una meet
 */
export const initMeetAudio = async (
  meetId: string,
  userId: string,
): Promise<Peer> => {
  try {
    // 1. Obtener audio del micrófono
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    // 2. Conectar a Peer.js server
    peer = new Peer(`${meetId}-${userId}`, {
      host: peerServerUrl.split(":")[0],
      port: parseInt(peerServerUrl.split(":")[1]) || 3001,
      path: "/",
    });

    // 3. Esperar a que la conexión esté lista
    await new Promise<void>((resolve, reject) => {
      peer!.on("open", () => {
        console.log("Conectado a PeerServer con ID:", peer!.id);
        resolve();
      });

      peer!.on("error", (error: Error) => {
        console.error("Error conectando a PeerServer:", error);
        reject(error);
      });
    });

    // 4. Configurar listeners básicos
    peer.on("call", handleIncomingCall);

    // 5. Manejar desconexiones
    peer.on("disconnected", () => {
      console.log("🔌 Desconectado del servidor Peer.js");
    });

    peer.on("close", () => {
      console.log("🔒 Conexión Peer.js cerrada");
      cleanup();
    });

    return peer;
  } catch (error) {
    console.error("Error iniciando audio:", error);
    cleanup();
    throw error;
  }
};

/**
 * Conecta al audio de otro usuario en la meet
 */
export const connectToUserAudio = (
  targetPeerId: string,
  targetUserId: string,
): Peer.MediaConnection | null => {
  if (!peer || peer.disconnected) {
    console.error("Peer no está conectado");
    return null;
  }

  if (!localStream) {
    console.error("No hay stream local disponible");
    return null;
  }

  try {
    console.log(`Llamando a usuario: ${targetUserId} (${targetPeerId})`);

    const call = peer.call(targetPeerId, localStream);

    call.on("stream", (remoteStream: MediaStream) => {
      console.log(`Recibiendo audio de: ${targetUserId}`);
      playRemoteAudio(targetUserId, remoteStream);
      activeCalls.set(targetUserId, call);
    });

    call.on("close", () => {
      console.log(`Llamada cerrada con: ${targetUserId}`);
      stopRemoteAudio(targetUserId);
      activeCalls.delete(targetUserId);
    });

    call.on("error", (err: Error) => {
      console.error(`Error en llamada con ${targetUserId}:`, err);
      stopRemoteAudio(targetUserId);
      activeCalls.delete(targetUserId);
    });

    return call;
  } catch (error) {
    console.error(`Error iniciando llamada a ${targetUserId}:`, error);
    return null;
  }
};

/**
 * Maneja llamadas entrantes de otros usuarios
 */
function handleIncomingCall(call: Peer.MediaConnection): void {
  if (!localStream) {
    console.error("No hay stream local para contestar llamada");
    call.close();
    return;
  }

  try {
    const remoteUserId = extractUserIdFromPeerId(call.peer);
    console.log(`📞 Llamada entrante de: ${remoteUserId}`);

    // Contestar la llamada
    call.answer(localStream);

    call.on("stream", (remoteStream: MediaStream) => {
      console.log(`Audio entrante de: ${remoteUserId}`);
      playRemoteAudio(remoteUserId, remoteStream);
      activeCalls.set(remoteUserId, call);
    });

    call.on("close", () => {
      console.log(`Llamada entrante cerrada: ${remoteUserId}`);
      stopRemoteAudio(remoteUserId);
      activeCalls.delete(remoteUserId);
    });

    call.on("error", (err: Error) => {
      console.error(`Error en llamada entrante de ${remoteUserId}:`, err);
      stopRemoteAudio(remoteUserId);
      activeCalls.delete(remoteUserId);
    });
  } catch (error) {
    console.error("Error manejando llamada entrante:", error);
    call.close();
  }
}

/**
 * Extrae el userId del peerId (formato: meetId-userId)
 */
function extractUserIdFromPeerId(peerId: string): string {
  const parts = peerId.split("-");
  return parts[parts.length - 1]; // Última parte es el userId
}

/**
 * Reproduce audio remoto
 */
function playRemoteAudio(userId: string, stream: MediaStream): void {
  // Detener audio anterior si existe
  stopRemoteAudio(userId);

  const audioEl = document.createElement("audio");
  audioEl.id = `audio_${userId}`;
  audioEl.srcObject = stream;
  audioEl.autoplay = true;
  audioEl.volume = 1;
  audioEl.controls = false;
  audioEl.setAttribute("data-user-id", userId);

  // Agregar al contenedor de audio (oculto)
  const container =
    document.getElementById("audio-container") || createAudioContainer();
  container.appendChild(audioEl);

  audioEl.addEventListener("loadeddata", () => {
    audioEl.play().catch((e) => console.warn("Error reproduciendo audio:", e));
  });
}

/**
 * Crea contenedor de audio si no existe
 */
function createAudioContainer(): HTMLDivElement {
  const container = document.createElement("div");
  container.id = "audio-container";
  container.style.display = "none"; // Oculto, solo para audio
  document.body.appendChild(container);
  return container;
}

/**
 * Detiene audio remoto
 */
function stopRemoteAudio(userId: string): void {
  const audioEl = document.getElementById(`audio_${userId}`);
  if (audioEl) {
    audioEl.pause();
    audioEl.srcObject = null;
    audioEl.remove();
  }
}

/**
 * Silencia/activa micrófono
 */
export const toggleMicrophone = (mute: boolean): boolean => {
  if (!localStream) {
    console.error("No hay stream local disponible");
    return false;
  }

  const audioTracks = localStream.getAudioTracks();
  if (audioTracks.length === 0) {
    console.error("No hay pistas de audio en el stream");
    return false;
  }

  audioTracks.forEach((track) => {
    track.enabled = !mute;
  });

  const newState = !mute;
  console.log(`🎤 Micrófono ${newState ? "activado" : "silenciado"}`);
  return newState;
};

/**
 * Obtiene el estado actual del micrófono
 */
export const getMicrophoneState = (): boolean => {
  if (!localStream) return false;

  const audioTracks = localStream.getAudioTracks();
  return audioTracks.length > 0 ? audioTracks[0].enabled : false;
};

/**
 * Obtiene el peerId actual
 */
export const getCurrentPeerId = (): string | null => {
  return peer ? peer.id : null;
};

/**
 * Obtiene los usuarios con audio activo
 */
export const getActiveAudioUsers = (): string[] => {
  return Array.from(activeCalls.keys());
};

/**
 * Cierra todas las conexiones de audio
 */
export const leaveMeetAudio = (): void => {
  console.log("Saliendo de la meet de audio...");

  // Cerrar todas las llamadas
  activeCalls.forEach((call, userId) => {
    call.close();
    stopRemoteAudio(userId);
  });
  activeCalls.clear();

  // Detener stream local
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  // Cerrar peer
  if (peer) {
    peer.destroy();
    peer = null;
  }

  console.log("Audio cleanup completado");
};

/**
 * Limpieza de recursos
 */
function cleanup(): void {
  activeCalls.clear();
  localStream = null;
  peer = null;
}

export default {
  initMeetAudio,
  connectToUserAudio,
  toggleMicrophone,
  getMicrophoneState,
  getCurrentPeerId,
  getActiveAudioUsers,
  leaveMeetAudio,
};
