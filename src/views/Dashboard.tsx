import "../styles/Dashboard.scss";
import UserNavbar from "../components/UserNavbar";
import hero2 from "../assets/hero2.jpeg";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleCrearReunion = () => navigate("/meeting");

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

          <button
            className="dashboard__button"
            onClick={handleCrearReunion}
          >
            Crear nueva reunión
          </button>
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