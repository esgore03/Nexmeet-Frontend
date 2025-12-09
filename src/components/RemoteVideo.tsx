/**
 * RemoteVideo component properties.
 * @typedef {Object} RemoteVideoProps
 * @property {MediaStream} stream - The incoming media stream to be rendered in the video element.
 * @property {string} userName - The name displayed under the video feed.
 */

import React, { useRef, useEffect } from "react";

interface RemoteVideoProps {
  stream: MediaStream;
  userName: string;
}
/**
 * Renders a remote video stream along with a username label.
 *
 * The component attaches the provided MediaStream to an HTMLVideoElement using a React ref.
 *
 * @param {RemoteVideoProps} props - Component properties.
 * @param {MediaStream} props.stream - The media stream to display.
 * @param {string} props.userName - The displayed name of the remote user.
 * @returns {JSX.Element} The rendered remote video component.
 */
const RemoteVideo: React.FC<RemoteVideoProps> = ({ stream, userName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="remote-video-wrapper">
      <video ref={videoRef} autoPlay playsInline className="remote-video" />
      <span className="video-label">{userName}</span>
    </div>
  );
};

export default RemoteVideo;
