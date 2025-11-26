import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/CreateMeeting.scss";
import UserNavbar from "../components/UserNavbar";

const CreateMeeting: React.FC = () => {
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setMeeting({ ...meeting, [e.target.id]: e.target.value });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!meeting.title || !meeting.date || !meeting.time) {
      setError("Todos los campos obligatorios deben completarse.");
      return;
    }

    setSuccess("Reunión creada con éxito.");
    setTimeout(() => navigate("/dashboard"), 1500);
  };

  return (
    <>
      {/* 🔵 NAVBAR DE USUARIO */}
      <UserNavbar />

      <div className="app-container-meeting">
        <div className="main-content-meeting">
          <div className="left-section-meeting">

            <div className="meeting-wrapper">
              <div className="meeting-box">
                <h2>Crear Nueva Reunión</h2>

                <form className="form" onSubmit={handleSubmit} noValidate>
                  <label htmlFor="title">Título de la reunión</label>
                  <input
                    type="text"
                    id="title"
                    className="input"
                    placeholder="Ej: Reunión del proyecto"
                    value={meeting.title}
                    onChange={handleChange}
                  />

                  <label htmlFor="description">Descripción</label>
                  <textarea
                    id="description"
                    className="textarea"
                    placeholder="Detalles de la reunión"
                    value={meeting.description}
                    onChange={handleChange}
                  ></textarea>

                  <div className="form-row">
                    <div style={{ flex: 1 }}>
                      <label htmlFor="date">Fecha</label>
                      <input
                        type="date"
                        id="date"
                        className="input"
                        value={meeting.date}
                        onChange={handleChange}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <label htmlFor="time">Hora</label>
                      <input
                        type="time"
                        id="time"
                        className="input"
                        value={meeting.time}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <button type="submit" className="button">
                    Crear reunión
                  </button>

                  {error && <div className="error-message">{error}</div>}
                  {success && <div className="success-message">{success}</div>}
                </form>

              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default CreateMeeting;


