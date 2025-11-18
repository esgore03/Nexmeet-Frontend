import hero1 from "../assets/hero1.jpeg";
import "../styles/Hero.scss";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const Hero: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => navigate("/login");
  const handleSignUpClick = () => navigate("/register");
  const handleAboutClick = () => navigate("/about"); 

  return (
    <section className="hero">
      {/* Top Bar - Replaces Navbar */}
      <div className="hero-topbar">
        <a href="/">
          <img src={logo} className="topbar-logo" alt="Nexmeet Logo" />
          <span id="topbar-logo-text" className="topbar-logo-text">
            Nexmeet
          </span>
        </a>

        <div className="topbar-buttons">
          
          <button
            onClick={handleAboutClick}
            className="topbar-button about-button"
          >
            Sobre nosotros
          </button>

          <button
            onClick={handleLoginClick}
            className="topbar-button login-button"
          >
            Iniciar Sesión{" "}
          </button>
          <button
            onClick={handleSignUpClick}
            className="topbar-button signup-button"
          >
            Registrarse{" "}
          </button>
        </div>
      </div>

      {/* Hero Content */}
      <div className="hero__content">
        <div className="hero__text-wrapper">
          <h1 className="hero__title">Conéctate sin límites con Nexmeet</h1>
          <p className="hero__subtitle">Tu espacio de conexión inteligente</p>
        </div>

        <div className="hero__image-wrapper">
          <img
            src={hero1}
            alt="Nexmeet - Conexión inteligente"
            className="hero__image"
          />
        </div>
      </div>

      <p className="hero__description-text">
        Organiza reuniones fácilmente, planifica y administra reuniones de vídeo
        de forma sencilla{" "}
      </p>
    </section>
  );
};

export default Hero;
