import "../styles/Dashboard.scss";
import UserNavbar from "../components/UserNavbar";
import hero2 from "../assets/hero2.jpeg";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { request } from "../utils/request";

type CreateMeetingResult =
  | { success: true; id: string }
  | { success: false; error: string };

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [joinId, setJoinId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCrearReunion = async () => {
    setLoading(true);
    setError("");

    try {
      // Obtener userId del localStorage
      const userId = localStorage.getItem("userId");

      if (!userId) {
        setError(
          "No se encontró información del usuario. Por favor, inicia sesión.",
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

      // Navegar a la reunión
      navigate(`/meeting/${response.id}`);
    } catch (error) {
      console.error("Error creando la reunión:", error);
      setError("Error al crear la reunión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnirseReunion = () => {
    if (!joinId.trim()) {
      setError("Por favor, ingresa un ID de reunión");
      return;
    }
    navigate(`/meeting/${joinId.trim()}`);
  };

  return (
    <section className="dashboard">
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
              />
              <button
                className="dashboard__button dashboard__button--secondary"
                onClick={handleUnirseReunion}
              >
                Unirse a reunión
              </button>
            </div>

            {error && <p className="dashboard__error">{error}</p>}
          </div>
        </div>

        <div className="dashboard__image-wrapper">
          <img
            src={hero2}
            alt="Dashboard preview"
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
