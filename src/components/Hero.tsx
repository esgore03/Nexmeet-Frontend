/**
 * @fileoverview The Hero component serves as the landing section of the application.
 * It includes a fixed top bar with navigation buttons and a hero banner with a title,
 * subtitle, and main promotional image. Accessibility features include focus visibility,
 * alt text for images, and live region updates for screen readers.
 *
 * @component
 * @example
 * return <Hero />;
 */

import hero1 from "../assets/hero1.jpeg";
import "../styles/Hero.scss";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const Hero: React.FC = () => {
  const navigate = useNavigate();

  /**
   * Navigates the user to the login page.
   * @function
   */
  const handleLoginClick = () => navigate("/login");

  /**
   * Navigates the user to the registration page.
   * @function
   */
  const handleSignUpClick = () => navigate("/register");

  /**
   * Navigates the user to the about page.
   * @function
   */
  const handleAboutClick = () => navigate("/about");

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
            onClick={handleAboutClick}
            className="topbar-button about-button"
            aria-label="Learn more about us"
          >
            Sobre nosotros
          </button>

          <button
            onClick={handleLoginClick}
            className="topbar-button login-button"
            aria-label="Go to login page"
          >
            Iniciar Sesión
          </button>

          <button
            onClick={handleSignUpClick}
            className="topbar-button signup-button"
            aria-label="Go to registration page"
          >
            Registrarse
          </button>
        </div>
      </div>

      <div className="hero__content">
        <div className="hero__text-wrapper">
          <h1 className="hero__title">Conéctate sin límites con Nexmeet</h1>
          <p className="hero__subtitle">Tu espacio de conexión inteligente</p>
        </div>

        <div className="hero__image-wrapper">
          <img
            src={hero1}
            alt="Nexmeet promotional illustration showing smart connection"
            className="hero__image"
          />
        </div>
      </div>

      <p className="hero__description-text">
        Organiza reuniones fácilmente, planifica y administra reuniones de vídeo
        de forma sencilla
      </p>
    </section>
  );
};

export default Hero;
