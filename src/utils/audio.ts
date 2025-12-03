import Peer from "peerjs";
import type { MediaConnection } from "peerjs";

const peerServerUrl = import.meta.env.VITE_AUDIO_SERVER_URL || "localhost:3001";

let peer: Peer | null = null;
let localStream: MediaStream | null = null;
let activeCalls: Map<string, MediaConnection> = new Map();

/**
 * Initializes audio for a meeting
 * @param {string} meetId - The meeting identifier
 * @param {string} userId - The user identifier
 * @returns {Promise<Peer>} A promise that resolves to the Peer instance
 * @throws {Error} If there's an error initializing the audio connection
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
 * Connects to another user's audio in the meeting
 * @param {string} targetPeerId - The peer ID of the target user
 * @param {string} targetUserId - The user ID of the target user
 * @returns {MediaConnection | null} The media connection instance or null if connection fails
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
 * Handles incoming calls from other users
 * @param {MediaConnection} call - The incoming media connection
 * @returns {void}
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
/**
 * Extracts the user ID from a peer ID
 * @param {string} peerId - The peer ID in format "meetId-userId"
 * @returns {string} The extracted user ID
 */
function extractUserIdFromPeerId(peerId: string): string {
  const parts = peerId.split("-");
  return parts[parts.length - 1];
}
/**
 * Plays remote audio from a user
 * @param {string} userId - The user ID of the remote audio source
 * @param {MediaStream} stream - The media stream to play
 * @returns {void}
 */
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

/**
 * Creates an audio container element in the DOM
 * @returns {HTMLDivElement} The created audio container element
 */
function createAudioContainer(): HTMLDivElement {
  const container = document.createElement("div");
  container.id = "audio-container";
  container.style.display = "none";
  document.body.appendChild(container);
  return container;
}

/**
 * Stops remote audio from a specific user
 * @param {string} userId - The user ID whose audio should be stopped
 * @returns {void}
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
/**
 * Toggles the microphone state (mute/unmute)
 * @param {boolean} mute - True to mute, false to unmute
 * @returns {boolean} The new state of the microphone (true if enabled, false if disabled)
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
  console.log(`Micrófono ${newState ? "activado" : "silenciado"}`);
  return newState;
};
/**
 * Gets the current microphone state
 * @returns {boolean} True if microphone is enabled, false otherwise
 */
export const getMicrophoneState = (): boolean => {
  if (!localStream) return false;

  const audioTracks = localStream.getAudioTracks();
  return audioTracks.length > 0 ? audioTracks[0].enabled : false;
};
/**
 * Gets the current peer ID
 * @returns {string | null} The current peer ID or null if not connected
 */
export const getCurrentPeerId = (): string | null => {
  return peer ? peer.id : null;
};
/**
 * Gets a list of all active audio users in the meeting
 * @returns {string[]} An array of user IDs with active audio connections
 */
export const getActiveAudioUsers = (): string[] => {
  return Array.from(activeCalls.keys());
};
/**
 * Leaves the audio meeting and cleans up all resources
 * @returns {void}
 */
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
/**
 * Cleans up all audio resources and connections
 * @returns {void}
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
