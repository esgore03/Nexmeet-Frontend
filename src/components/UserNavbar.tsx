/**
 * @fileoverview The UserNavbar component provides navigation for logged-in users.
 * It includes a logo link and multiple action buttons that navigate to different sections
 * of the application. Accessibility features include keyboard focus handling and
 * a live region for screen reader updates.
 *
 * @component
 * @example
 * return <UserNavbar />;
 */

import "../styles/UserNavbar.scss";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const UserNavbar: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /**
   * Navigates to a specific path in the application.
   * @function
   * @param {string} path - The route to navigate to.
   * @returns {void}
   */
  const handleNavigation = (path: string): void => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = (): void => {
    setIsMenuOpen(false);
  };

  return (
    <nav
      className="user-navbar"
      role="navigation"
      aria-label="User navigation bar"
      aria-live="polite"
    >
      <button
        onClick={() => handleNavigation("/dashboard")}
        className="user-navbar-logo"
        aria-label="Go to dashboard"
      >
        <img src={logo} alt="Nexmeet logo" />
        <span className="user-navbar-logo-text">Nexmeet</span>
      </button>

      <button
        className="user-navbar-menu-icon"
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
        aria-expanded={isMenuOpen}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isMenuOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      <div
        className={`user-navbar-overlay ${isMenuOpen ? "open" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <div className={`user-navbar-links ${isMenuOpen ? "open" : ""}`}>
        <button
          onClick={() => handleNavigation("/dashboard")}
          aria-label="Go to home page"
        >
          Inicio
        </button>
        <button
          onClick={() => handleNavigation("/meeting")}
          aria-label="View meetings"
        >
          Reuniones
        </button>

        <button
          onClick={() => handleNavigation("/profile")}
          aria-label="View profile"
        >
          Perfil
        </button>
        <button onClick={() => handleNavigation("/login")} aria-label="Log out">
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
};

export default UserNavbar;
