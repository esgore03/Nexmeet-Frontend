import "../styles/aboutUs.scss";
import aboutImage from "../assets/hero3.jpg";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";

const AboutUs: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="hero">   

      <div className="hero-topbar">
        <button onClick={() => navigate("/")} className="topbar-logo-container">
          <img src={logo} className="topbar-logo" alt="Nexmeet Logo" />
          <span className="topbar-logo-text">Nexmeet</span>
        </button>

        <div className="topbar-buttons">
          <button onClick={() => navigate("/login")}>Iniciar Sesión</button>
          <button onClick={() => navigate("/register")}>Registrarse</button>
        </div>
      </div>

     
      <div className="hero__content">
        <div className="hero__text-wrapper">
          <h1 className="hero__title">Sobre Nosotros</h1>
          <p className="hero__subtitle">
            Nexmeet conecta personas mediante videoconferencias
            rápidas, fluidas y accesibles en cualquier dispositivo.
          </p>
          <p className="hero__subtitle">
            Creada para simplificar la comunicación moderna, sin límites y sin complicaciones.
          </p>
        </div>

        <div className="hero__image-wrapper">
          <img src={aboutImage} className="hero__image" alt="About us" />
        </div>
      </div>

      <h2 className="about__team-title">Equipo de trabajo</h2>

      <div className="about__team">
        {[
          { letter: "I", name: "Isabella Ruiz" },
          { letter: "N", name: "Nicolas Salazar" },
          { letter: "J", name: "Jorge Alvarez" },
          { letter: "E", name: "Esteban Gomez" },
          { letter: "J", name: "Jhorman Gomez" },
        ].map((member, index) => (
          <div key={index} className="about__team-member">
            <div className="about__avatar">{member.letter}</div>
            <p className="about__member-name">{member.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AboutUs;
