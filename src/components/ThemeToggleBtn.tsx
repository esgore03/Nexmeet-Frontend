import assets from "../assets/assets";
import "../styles/ThemeToggleBtn.scss";

interface ThemeToggleBtnProps {
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
}

const ThemeToggleBtn: React.FC<ThemeToggleBtnProps> = ({ theme, setTheme }) => {
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  return (
    <button onClick={toggleTheme} className="theme-toggle-btn">
      {theme === "dark" ? (
        <img
          src={assets.sun_icon}
          className="theme-toggle-icon"
          alt="Switch to light mode"
        />
      ) : (
        <img
          src={assets.moon_icon}
          className="theme-toggle-icon"
          alt="Switch to dark mode"
        />
      )}
    </button>
  );
};

export default ThemeToggleBtn;
