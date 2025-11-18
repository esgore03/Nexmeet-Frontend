import React, { useState } from "react";
import chat from "../assets/chat.png";
import participants from "../assets/participants.png";
import end_call from "../assets/end_call.webp";
import micro from "../assets/micro.png";
import camera from "../assets/camera.png";
import "../styles/meeting.scss";
import { useNavigate } from "react-router-dom";

const Meeting: React.FC = () => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      setMessages([...messages, messageInput]);
      setMessageInput("");
    }
  };

  const handleEndCall = () => {
    console.log("Llamada finalizada");
     navigate("/dashboard");
    // Lógica para finalizar la llamada
  };

  return (
    <div className="video-call">
      {/* Área principal de video */}
      <div className="video-container">
        <h1>Video Call</h1>
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
          onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
          title="Participantes"
        >
          <img src={participants} alt="Participantes" />
        </button>

        <button
          className="side-btn"
          onClick={() => setIsChatOpen(!isChatOpen)}
          title="Chat"
        >
          <img src={chat} alt="Chat" />
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
            messages.map((msg, index) => (
              <div key={index} className="message">
                <span className="message-text">{msg}</span>
              </div>
            ))
          )}
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
          <h3>Participantes</h3>
          <button
            className="close-btn"
            onClick={() => setIsParticipantsOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="participants-content">
          <ul className="participants-list">
            <li>Usuario 1</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Meeting;
