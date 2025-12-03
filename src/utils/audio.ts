import Peer from "peerjs";
import type { MediaConnection } from "peerjs";

const peerServerUrl = import.meta.env.VITE_AUDIO_SERVER_URL || "localhost:3001";

let peer: Peer | null = null;
let localStream: MediaStream | null = null;
let activeCalls: Map<string, MediaConnection> = new Map();

/**
 * Inicializa audio para una meet
 */
export const initMeetAudio = async (
  meetId: string,
  userId: string,
): Promise<Peer> => {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    peer = new Peer(`${meetId}-${userId}`, {
      host: peerServerUrl.split(":")[0],
      port: parseInt(peerServerUrl.split(":")[1]) || 3001,
      path: "/",
    });

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

    peer.on("call", handleIncomingCall);

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
): MediaConnection | null => {
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
function handleIncomingCall(call: MediaConnection): void {
  if (!localStream) {
    console.error("No hay stream local para contestar llamada");
    call.close();
    return;
  }

  try {
    const remoteUserId = extractUserIdFromPeerId(call.peer);
    console.log(`📞 Llamada entrante de: ${remoteUserId}`);

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

function extractUserIdFromPeerId(peerId: string): string {
  const parts = peerId.split("-");
  return parts[parts.length - 1];
}

function playRemoteAudio(userId: string, stream: MediaStream): void {
  stopRemoteAudio(userId);

  const audioEl = document.createElement("audio");
  audioEl.id = `audio_${userId}`;
  audioEl.srcObject = stream;
  audioEl.autoplay = true;
  audioEl.volume = 1;
  audioEl.controls = false;
  audioEl.setAttribute("data-user-id", userId);

  const container =
    document.getElementById("audio-container") || createAudioContainer();
  container.appendChild(audioEl);

  audioEl.addEventListener("loadeddata", () => {
    audioEl.play().catch((e) => console.warn("Error reproduciendo audio:", e));
  });
}

function createAudioContainer(): HTMLDivElement {
  const container = document.createElement("div");
  container.id = "audio-container";
  container.style.display = "none";
  document.body.appendChild(container);
  return container;
}

/**
 * Detiene audio remoto
 */
function stopRemoteAudio(userId: string): void {
  const audioEl = document.getElementById(
    `audio_${userId}`,
  ) as HTMLAudioElement | null;

  if (audioEl) {
    audioEl.pause();
    audioEl.srcObject = null;
    audioEl.remove();
  }
}

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
  console.log(`Micrófono ${newState ? "activado" : "silenciado"}`);
  return newState;
};

export const getMicrophoneState = (): boolean => {
  if (!localStream) return false;

  const audioTracks = localStream.getAudioTracks();
  return audioTracks.length > 0 ? audioTracks[0].enabled : false;
};

export const getCurrentPeerId = (): string | null => {
  return peer ? peer.id : null;
};

export const getActiveAudioUsers = (): string[] => {
  return Array.from(activeCalls.keys());
};

export const leaveMeetAudio = (): void => {
  console.log("Saliendo de la meet de audio...");

  activeCalls.forEach((call, userId) => {
    call.close();
    stopRemoteAudio(userId);
  });
  activeCalls.clear();

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  if (peer) {
    peer.destroy();
    peer = null;
  }

  console.log("Audio cleanup completado");
};

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
