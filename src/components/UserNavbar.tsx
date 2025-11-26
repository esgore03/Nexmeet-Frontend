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

const UserNavbar: React.FC = () => {
  const navigate = useNavigate();

  /**
   * Navigates to a specific path in the application.
   * @function
   * @param {string} path - The route to navigate to.
   * @returns {void}
   */
  const handleNavigation = (path: string): void => {
    navigate(path);
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

      <div className="user-navbar-links">
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
