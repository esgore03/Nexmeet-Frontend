import Peer from "peerjs";
import type { MediaConnection } from "peerjs";

const peerServerUrl = import.meta.env.VITE_VIDEO_SERVER_URL || "localhost:3002";

let peer: Peer | null = null;
let localStream: MediaStream | null = null;
const videoConnections: Map<string, MediaConnection> = new Map();
const remoteStreams: Map<string, MediaStream> = new Map();

let onRemoteStreamAdded:
  | ((userId: string, stream: MediaStream) => void)
  | null = null;
let onRemoteStreamRemoved: ((userId: string) => void) | null = null;

/**
 * Initializes video for a meeting
 * @param {string} meetingId - The meeting identifier
 * @param {string} userId - The user identifier
 * @param {Function} onStreamAdded - Callback when a remote stream is added
 * @param {Function} onStreamRemoved - Callback when a remote stream is removed
 * @returns {Promise<MediaStream>} A promise that resolves to the local MediaStream
 * @throws {Error} If there's an error initializing the video connection
 */
export const initMeetVideo = async (
  meetingId: string,
  userId: string,
  onStreamAdded: (userId: string, stream: MediaStream) => void,
  onStreamRemoved: (userId: string) => void,
): Promise<MediaStream> => {
  onRemoteStreamAdded = onStreamAdded;
  onRemoteStreamRemoved = onStreamRemoved;

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user",
      },
      audio: false,
    });

    peer = new Peer(`${meetingId}-${userId}`, {
      host: peerServerUrl.split(":")[0],
      port: parseInt(peerServerUrl.split(":")[1]) || 3002,
      path: "/",
    });

    await new Promise<void>((resolve, reject) => {
      peer!.on("open", () => {
        console.log("Conectado a PeerServer (video) con ID:", peer!.id);
        resolve();
      });

      peer!.on("error", (error: Error) => {
        console.error("Error conectando a PeerServer (video):", error);
        reject(error);
      });
    });

    peer.on("call", handleIncomingCall);

    peer.on("disconnected", () => {
      console.log("Desconectado del servidor Peer.js (video)");
    });

    peer.on("close", () => {
      console.log("Conexión Peer.js (video) cerrada");
      cleanup();
    });

    return localStream;
  } catch (error) {
    console.error("Error iniciando video:", error);
    cleanup();
    throw error;
  }
};

/**
 * Handles incoming video calls from other users
 * @param {MediaConnection} call - The incoming media connection
 * @returns {void}
 */
function handleIncomingCall(call: MediaConnection): void {
  if (!localStream) {
    console.error("No hay stream local para contestar llamada de video");
    call.close();
    return;
  }

  try {
    const remoteUserId = extractUserIdFromPeerId(call.peer);
    console.log(`Llamada de video entrante de: ${remoteUserId}`);

    call.answer(localStream);

    call.on("stream", (remoteStream: MediaStream) => {
      console.log(`Video entrante de: ${remoteUserId}`);
      remoteStreams.set(remoteUserId, remoteStream);
      videoConnections.set(remoteUserId, call);
      onRemoteStreamAdded?.(remoteUserId, remoteStream);
    });

    call.on("close", () => {
      console.log(`Llamada de video cerrada: ${remoteUserId}`);
      remoteStreams.delete(remoteUserId);
      videoConnections.delete(remoteUserId);
      onRemoteStreamRemoved?.(remoteUserId);
    });

    call.on("error", (err: Error) => {
      console.error(`Error en llamada de video de ${remoteUserId}:`, err);
      remoteStreams.delete(remoteUserId);
      videoConnections.delete(remoteUserId);
      onRemoteStreamRemoved?.(remoteUserId);
    });
  } catch (error) {
    console.error("Error manejando llamada de video entrante:", error);
    call.close();
  }
}

/**
 * Extracts the user ID from a peer ID
 * @param {string} peerId - The peer ID in format "meetId-oduserId"
 * @returns {string} The extracted user ID
 */
function extractUserIdFromPeerId(peerId: string): string {
  const parts = peerId.split("-");
  return parts[parts.length - 1];
}

/**
 * Connects to another user's video in the meeting
 * @param {string} targetPeerId - The peer ID of the target user
 * @param {string} targetUserId - The user ID of the target user
 * @returns {MediaConnection | null} The media connection instance or null if connection fails
 */
export const connectToUserVideo = (
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

  if (videoConnections.has(targetUserId)) {
    console.log(`Ya existe conexión de video con: ${targetUserId}`);
    return videoConnections.get(targetUserId)!;
  }

  try {
    console.log(
      `Llamando a usuario (video): ${targetUserId} (${targetPeerId})`,
    );

    const call = peer.call(targetPeerId, localStream);

    call.on("stream", (remoteStream: MediaStream) => {
      console.log(`Recibiendo video de: ${targetUserId}`);
      remoteStreams.set(targetUserId, remoteStream);
      videoConnections.set(targetUserId, call);
      onRemoteStreamAdded?.(targetUserId, remoteStream);
    });

    call.on("close", () => {
      console.log(`Llamada de video cerrada con: ${targetUserId}`);
      remoteStreams.delete(targetUserId);
      videoConnections.delete(targetUserId);
      onRemoteStreamRemoved?.(targetUserId);
    });

    call.on("error", (err: Error) => {
      console.error(`Error en llamada de video con ${targetUserId}:`, err);
      remoteStreams.delete(targetUserId);
      videoConnections.delete(targetUserId);
      onRemoteStreamRemoved?.(targetUserId);
    });

    return call;
  } catch (error) {
    console.error(`Error iniciando llamada de video a ${targetUserId}:`, error);
    return null;
  }
};

/**
 * Toggles the camera state (on/off)
 * @param {boolean} currentState - Current state of the camera (true = on, false = off)
 * @returns {boolean} The new state of the camera
 */
export const toggleCamera = (currentState: boolean): boolean => {
  if (!localStream) {
    console.error("No hay stream local disponible");
    return currentState;
  }

  const videoTracks = localStream.getVideoTracks();
  if (videoTracks.length === 0) {
    console.error("No hay pistas de video en el stream");
    return currentState;
  }

  videoTracks.forEach((track) => {
    track.enabled = !currentState;
  });

  const newState = !currentState;
  console.log(`Cámara ${newState ? "activada" : "desactivada"}`);
  return newState;
};

/**
 * Gets the current camera state
 * @returns {boolean} True if camera is enabled, false otherwise
 */
export const getCameraState = (): boolean => {
  if (!localStream) return false;

  const videoTracks = localStream.getVideoTracks();
  return videoTracks.length > 0 ? videoTracks[0].enabled : false;
};

/**
 * Gets the local video stream
 * @returns {MediaStream | null} The local media stream or null if not initialized
 */
export const getLocalStream = (): MediaStream | null => {
  return localStream;
};

/**
 * Gets the current peer ID
 * @returns {string | null} The current peer ID or null if not connected
 */
export const getCurrentPeerId = (): string | null => {
  return peer ? peer.id : null;
};

/**
 * Gets a list of all active video users in the meeting
 * @returns {string[]} An array of user IDs with active video connections
 */
export const getActiveVideoUsers = (): string[] => {
  return Array.from(videoConnections.keys());
};

/**
 * Gets all remote video streams
 * @returns {Map<string, MediaStream>} Map of user IDs to their video streams
 */
export const getRemoteStreams = (): Map<string, MediaStream> => {
  return new Map(remoteStreams);
};

/**
 * Leaves the video meeting and cleans up all resources
 * @returns {void}
 */
export const leaveMeetVideo = (): void => {
  console.log("Saliendo de la meet de video...");

  videoConnections.forEach((call) => {
    call.close();
  });
  videoConnections.clear();
  remoteStreams.clear();

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  if (peer) {
    peer.destroy();
    peer = null;
  }

  onRemoteStreamAdded = null;
  onRemoteStreamRemoved = null;

  console.log("Video cleanup completado");
};

/**
 * Cleans up all video resources and connections
 * @returns {void}
 */
function cleanup(): void {
  videoConnections.clear();
  remoteStreams.clear();
  localStream = null;
  peer = null;
  onRemoteStreamAdded = null;
  onRemoteStreamRemoved = null;
}

export default {
  initMeetVideo,
  connectToUserVideo,
  toggleCamera,
  getCameraState,
  getLocalStream,
  getCurrentPeerId,
  getActiveVideoUsers,
  getRemoteStreams,
  leaveMeetVideo,
};
