import "../styles/UserNavbar.scss";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";

const UserNavbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="user-navbar">
      <a onClick={() => navigate("/dashboard")} className="user-navbar-logo">
        <img src={logo} alt="Nexmeet Logo" />
        <span className="user-navbar-logo-text">Nexmeet</span>
      </a>

      <div className="user-navbar-links">
        <button onClick={() => navigate("/dashboard")}>Inicio</button>
        <button onClick={() => navigate("/meeting")}>Reuniones</button>
        <button onClick={() => navigate("/meeting/create")}>
          Crear reunión
        </button>
        <button onClick={() => navigate("/profile")}>Perfil</button>
        <button onClick={() => navigate("/login")}>Cerrar sesión</button>
      </div>
    </nav>
  );
};

export default UserNavbar;
