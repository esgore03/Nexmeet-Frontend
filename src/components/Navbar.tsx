import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import ThemeToggleBtn from "./ThemeToggleBtn";
import "../styles/Navbar.scss";

interface NavbarProps {
  theme: string;
  setTheme: (theme: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ theme, setTheme }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavClick = (sectionId: string) => {
    setSidebarOpen(false);
    navigate("/");
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <div className={`navbar ${theme === "dark" ? "dark" : "light"}`}>
      <Link to="/">
        <img
          src={theme === "dark" ? assets.logo_dark : assets.logo}
          className="navbar-logo"
          alt="Logo"
        />
      </Link>

      <div className={`navbar-links ${sidebarOpen ? "open" : ""}`}>
        <img
          src={assets.close_icon}
          className="close-icon"
          alt="Close Icon"
          onClick={() => setSidebarOpen(false)}
        />

        <button onClick={() => handleNavClick("inicio")}>Inicio</button>
        <button onClick={() => handleNavClick("about-us")}>
          Sobre Nosotros
        </button>
      </div>

      <div className="navbar-right">
        <ThemeToggleBtn theme={theme} setTheme={setTheme} />

        <img
          src={theme === "dark" ? assets.menu_icon_dark : assets.menu_icon}
          alt="Open navigation menu"
          onClick={() => setSidebarOpen(true)}
          className="menu-icon"
        />

        <button onClick={() => handleNavClick("login")}>Iniciar Sesión</button>
        <button onClick={() => handleNavClick("signUp")}>Registrarse</button>
      </div>
    </div>
  );
};

export default Navbar;
