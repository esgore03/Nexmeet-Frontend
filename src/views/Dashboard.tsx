/**
 * @fileoverview The Dashboard component serves as the central hub for Nexmeet users.
 * It allows users to create new meetings, join existing ones, and manage their sessions.
 * Accessibility features include aria-live for screen readers and focus-visible outlines
 * for keyboard navigation.
 *
 * @component
 * @example
 * return <Dashboard />;
 */

import "../styles/Dashboard.scss";
import UserNavbar from "../components/UserNavbar";
import hero2 from "../assets/hero2.jpeg";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { request } from "../utils/request";

/**
 * Type representing the result of a meeting creation request.
 * @typedef {Object} CreateMeetingResult
 * @property {boolean} success - Indicates if the meeting creation was successful.
 * @property {string} [id] - The ID of the created meeting, if successful.
 * @property {string} [error] - Error message if the creation failed.
 */
type CreateMeetingResult =
  | { success: true; id: string }
  | { success: false; error: string };

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [joinId, setJoinId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Handles meeting creation by sending a request to the backend.
   * Displays errors and manages loading state.
   *
   * @async
   * @function handleCrearReunion
   * @returns {Promise<void>}
   */
  const handleCrearReunion = async () => {
    setLoading(true);
    setError("");

    try {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        setError(
          "User information not found. Please log in before creating a meeting.",
        );
        setLoading(false);
        return;
      }

      const response = await request<CreateMeetingResult>({
        method: "POST",
        endpoint: `/api/meetings/start`,
        data: { userId },
        headers: { "Content-Type": "application/json" },
      });

      if (!response.success) {
        setError(response.error);
        setLoading(false);
        return;
      }

      navigate(`/meeting/${response.id}`);
    } catch (error) {
      console.error("Error creating meeting:", error);
      setError(
        "An error occurred while creating the meeting. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles joining a meeting by ID.
   *
   * @function handleUnirseReunion
   * @returns {void}
   */
  const handleUnirseReunion = () => {
    if (!joinId.trim()) {
      setError("Please enter a valid meeting ID.");
      return;
    }
    navigate(`/meeting/${joinId.trim()}`);
  };

  return (
    <section className="dashboard" aria-live="polite">
      <UserNavbar />

      <div className="dashboard__content">
        <div className="dashboard__text-wrapper">
          <h1 className="dashboard__title">Bienvenido a tu panel Nexmeet</h1>
          <p className="dashboard__subtitle">
            Gestiona tus reuniones, conéctate con otros usuarios y organiza tu
            tiempo fácilmente.
          </p>

          <div className="dashboard__actions">
            <button
              className="dashboard__button"
              onClick={handleCrearReunion}
              disabled={loading}
              aria-label="Create a new meeting"
            >
              {loading ? "Creando..." : "Crear nueva reunión"}
            </button>

            <div className="dashboard__join-section">
              <input
                type="text"
                placeholder="ID de la reunión"
                value={joinId}
                onChange={(e) => {
                  setJoinId(e.target.value);
                  setError("");
                }}
                className="dashboard__join-input"
                onKeyPress={(e) => e.key === "Enter" && handleUnirseReunion()}
                aria-label="Enter meeting ID"
              />
              <button
                className="dashboard__button dashboard__button--secondary"
                onClick={handleUnirseReunion}
                aria-label="Join meeting by ID"
              >
                Unirse a reunión
              </button>
            </div>

            {error && (
              <p
                className="dashboard__error"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="dashboard__image-wrapper">
          <img
            src={hero2}
            alt="Nexmeet dashboard preview"
            className="dashboard__image"
          />
        </div>
      </div>

      <p className="dashboard__description-text">
        Revisa tus próximas reuniones o crea una nueva para mantenerte
        conectado. Tu productividad empieza aquí.
      </p>
    </section>
  );
};

export default Dashboard;
