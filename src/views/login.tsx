import React, { useState } from "react";
import "../styles/Login.scss";
import { Link } from "react-router-dom";
import { validateLoginForm } from "../utils/validators";
import logo from "../assets/logo.png";
import discord from "../assets/discord.webp";
import github from "../assets/github.png";
import google from "../assets/google.png";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import {
  auth,
  googleProvider,
  discordProvider,
  githubProvider,
} from "../config/firebase";
import { httpClient } from "../utils/httpClient";
import { API_ENDPOINTS } from "../utils/constants";
import { fetchSignInMethodsForEmail } from "firebase/auth";
/**
 * Displays a temporary popup success message on the screen.
 *
 * @function showSuccess
 * @param {string} message - The message text to display.
 * @example
 * showSuccess("Login successful!");
 */
function showSuccess(message: string) {
  let popup = document.getElementById("popup-message");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "popup-message";
    document.body.appendChild(popup);
  }

  popup.className = "popup-message popup-success popup-show";
  popup.textContent = message;

  clearTimeout((popup as any)._timeout);
  (popup as any)._timeout = setTimeout(() => {
    popup?.classList.remove("popup-show");
  }, 3000);
}
/**
 * Login Page Component
 *
 * Allows users to log in via email/password or third-party providers (Google, Discord, GitHub).
 * Integrates with Firebase Authentication and the custom backend API.
 * Handles input validation, error messages, token storage, and redirects.
 *
 * @component
 * @returns {JSX.Element} Rendered login page with form and social login options.
 */
const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  /**
   * Handles user input updates for email and password fields.
   * Clears related validation and form-level errors.
   *
   * @function handleChange
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setErrors({ ...errors, [e.target.id]: undefined });
    setFormError(null);
  };
  /**
   * Handles login form submission.
   * Validates inputs, authenticates via Firebase email/password,
   * then fetches or initializes the user record in the backend.
   *
   * @async
   * @function handleSubmit
   * @param {React.FormEvent} e - Form submission event.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const { isValid, errors: validationErrors } = validateLoginForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      const user = userCredential.user;
      const token = await user.getIdToken();

      localStorage.setItem("authToken", token);

      try {
        const userData = await httpClient.get(`/api/users/${user.uid}`);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (error) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: user.uid,
            email: user.email,
            name: user.displayName || formData.email.split("@")[0],
            photoURL: user.photoURL,
          }),
        );
      }

      showSuccess("Login exitoso! Redirigiendo...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (error: any) {
      console.error("Error en login:", error);

      let errorMessage = "Error al iniciar sesión";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No existe una cuenta con este email";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Contraseña incorrecta";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "El formato del email es inválido";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "Esta cuenta ha sido deshabilitada";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Demasiados intentos fallidos. Intenta más tarde";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Email o contraseña incorrectos";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  /**
   * Handles user login using external providers (Google, Discord, GitHub).
   * Creates the user in the backend if they do not exist.
   * Handles multiple authentication provider conflicts.
   *
   * @async
   * @function handleSocialLogin
   * @param {any} provider - The Firebase Authentication provider instance.
   * @returns {Promise<void>}
   */
  const handleSocialLogin = async (provider: any) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const token = await user.getIdToken();

      const userName =
        user.displayName || user.email?.split("@")[0] || "Usuario";

      localStorage.setItem("authToken", token);

      try {
        const userData = await httpClient.get(`/api/users/${user.uid}`);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (error: any) {
        if (error?.status === 404 || error?.status === 400) {
          await httpClient.post(API_ENDPOINTS.REGISTER, {
            name: userName,
            photoURL: user.photoURL,
            age: 25,
          });

          localStorage.setItem(
            "user",
            JSON.stringify({
              id: user.uid,
              email: user.email,
              name: userName,
              photoURL: user.photoURL,
            }),
          );
        }
      }

      showSuccess("¡Login exitoso! Redirigiendo...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (error: any) {
      console.error("Error en login social:", error);

      if (error?.code === "auth/account-exists-with-different-credential") {
        try {
          const email = error.customData?.email;

          if (!email) {
            setFormError("No se pudo obtener el email. Intenta nuevamente.");
            return;
          }

          const methods = await fetchSignInMethodsForEmail(auth, email);

          const providerNames: { [key: string]: string } = {
            "google.com": "Google",
            "oidc.discord": "Discord", // ✅ Cambio aquí
            "github.com": "GitHub",
            password: "Email/Contraseña",
          };

          const existingProvider = providerNames[methods[0]] || methods[0];

          setFormError(
            `Este email ya está registrado con ${existingProvider}. ` +
              `Por favor, inicia sesión con ${existingProvider} primero.`,
          );

          localStorage.setItem(
            "pendingCredential",
            JSON.stringify({
              email,
              providerId: error.credential?.providerId,
              credential: error.credential?.toJSON(),
            }),
          );
        } catch (linkError) {
          console.error("Error al manejar cuenta duplicada:", linkError);
          setFormError(
            "Ya existe una cuenta con este email usando otro método de inicio de sesión.",
          );
        }
        return;
      }

      if (error?.code === "auth/popup-closed-by-user") {
        setFormError("El proceso de inicio de sesión fue cancelado");
        return;
      }

      if (error?.code === "auth/cancelled-popup-request") {
        return;
      }

      setFormError("Hubo un error al iniciar sesión con el proveedor.");
    }
  };

  return (
    <>
      <div className="hero-topbar">
        <a href="/">
          <img src={logo} className="topbar-logo" alt="Nexmeet Logo" />
          <span id="topbar-logo-text" className="topbar-logo-text">
            Nexmeet
          </span>
        </a>
      </div>
      <div className="app-container">
        <div className="login-wrapper">
          <Link
            to="/"
            className="back-arrow-login"
            aria-label="Volver a la página principal"
          >
            <span aria-hidden="true">←</span>
          </Link>

          <div className="login-box">
            <h2>Inicia Sesión</h2>

            <form className="form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                placeholder="tu@email.com"
                className="input"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                aria-label="Ingresa tu correo electrónico"
                aria-required="true"
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && (
                <span className="error-message" role="alert">
                  {errors.email}
                </span>
              )}

              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                placeholder="********"
                className="input"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                aria-label="Ingresa tu contraseña"
                aria-required="true"
                aria-invalid={errors.password ? "true" : "false"}
              />
              {errors.password && (
                <span className="error-message" role="alert">
                  {errors.password}
                </span>
              )}

              <button
                type="submit"
                className="button"
                disabled={loading}
                aria-label={loading ? "Iniciando sesión" : "Iniciar sesión"}
              >
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>

              <Link to="/recover-password" className="forgot-password">
                ¿Olvidaste tu contraseña?
              </Link>

              {formError && (
                <div
                  className="error-message"
                  style={{ marginTop: 8 }}
                  role="alert"
                  aria-live="polite"
                >
                  {formError}
                </div>
              )}
            </form>

            <p className="register-text">
              ¿No tienes cuenta?{" "}
              <span className="register-link-wrapper">
                <a href="/register" className="register-link">
                  Regístrate aquí
                </a>
              </span>
            </p>

            {/* Redes sociales */}
            <div className="social-media-container">
              <button
                type="button"
                className="social-link"
                onClick={() => handleSocialLogin(googleProvider)}
                aria-label="Iniciar sesión con Google"
              >
                <img src={google} className="social-logo" alt="Google Logo" />
              </button>
              {/* ✅ Cambio aquí */}
              <button
                type="button"
                className="social-link"
                onClick={() => handleSocialLogin(discordProvider)}
                aria-label="Iniciar sesión con Discord"
              >
                <img src={discord} className="social-logo" alt="Discord Logo" />
              </button>
              <button
                type="button"
                className="social-link"
                onClick={() => handleSocialLogin(githubProvider)}
                aria-label="Iniciar sesión con GitHub"
              >
                <img src={github} className="social-logo" alt="Github Logo" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
