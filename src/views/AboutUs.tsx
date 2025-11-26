/**
 * @fileoverview The AboutUs component provides information about the Nexmeet platform
 * and its team. It includes a navigation top bar and descriptive content about
 * the company and its purpose. Accessibility features are added through aria-live
 * for screen readers and focus-visible outlines for keyboard users.
 *
 * @component
 * @example
 * return <AboutUs />;
 */

import "../styles/aboutUs.scss";
import aboutImage from "../assets/hero3.jpg";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";

const AboutUs: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="hero" aria-live="polite">
      <div className="hero-topbar">
        <a href="/" aria-label="Go to Nexmeet homepage">
          <img src={logo} className="topbar-logo" alt="Nexmeet Logo" />
          <span id="topbar-logo-text" className="topbar-logo-text">
            Nexmeet
          </span>
        </a>

        <div className="topbar-buttons">
          <button
            onClick={() => navigate("/login")}
            aria-label="Go to login page"
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => navigate("/register")}
            aria-label="Go to register page"
          >
            Registrarse
          </button>
        </div>
      </div>

      <div className="hero__content">
        <div className="hero__text-wrapper">
          <h1 className="hero__title">Sobre Nosotros</h1>
          <p className="hero__subtitle">
            Nexmeet conecta personas mediante videoconferencias rápidas, fluidas
            y accesibles en cualquier dispositivo.
          </p>
          <p className="hero__subtitle">
            Creada para simplificar la comunicación moderna, sin límites y sin
            complicaciones.
          </p>
        </div>

        <div className="hero__image-wrapper">
          <img
            src={aboutImage}
            className="hero__image"
            alt="Illustration representing collaboration and teamwork on Nexmeet"
          />
        </div>
      </div>

      <h2 className="about__team-title">Equipo de trabajo</h2>

      <div
        className="about__team"
        role="region"
        aria-label="Team members section"
      >
        {[
          { letter: "I", name: "Isabella Ruiz" },
          { letter: "N", name: "Nicolas Salazar" },
          { letter: "J", name: "Jorge Alvarez" },
          { letter: "E", name: "Esteban Gomez" },
          { letter: "J", name: "Jhorman Gomez" },
        ].map((member, index) => (
          <div key={index} className="about__team-member" tabIndex={0}>
            <div
              className="about__avatar"
              role="img"
              aria-label={`Avatar of ${member.name}`}
            >
              {member.letter}
            </div>
            <p className="about__member-name">{member.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AboutUs;
