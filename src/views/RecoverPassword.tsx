/**
 * @file RecoverPassword.tsx
 * @description Password recovery page for Nexmeet. Handles user password reset via Firebase Authentication,
 * input validation, and feedback messages for success or error states.
 */

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";
import "../styles/recoverPassword.scss";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

/**
 * RecoverPassword Component
 *
 * Provides a simple form to allow users to recover their password.
 * It validates the email, sends a password reset request using Firebase,
 * and shows feedback messages for different outcomes.
 *
 * @component
 * @returns {JSX.Element} The rendered password recovery page.
 */
const RecoverPassword: React.FC = () => {
  /** @state email - Stores the email input entered by the user. */
  const [email, setEmail] = useState("");

  /** @state message - Success message displayed after a successful password reset email is sent. */
  const [message, setMessage] = useState("");

  /** @state error - Error message shown when something goes wrong during reset process. */
  const [error, setError] = useState("");

  /** @state loading - Indicates whether the request is being processed. */
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /**
   * Validates if an email address is correctly formatted.
   *
   * @function isValidEmail
   * @param {string} email - The email address to validate.
   * @returns {boolean} True if valid, false otherwise.
   */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Handles the submit event of the password recovery form.
   * Validates the email, triggers Firebase's `sendPasswordResetEmail`,
   * and provides feedback messages depending on success or error.
   *
   * @async
   * @function handleRecover
   * @param {React.FormEvent} e - The form submission event.
   * @returns {Promise<void>}
   */
  const handleRecover = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Por favor, ingresa tu correo electrónico");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Por favor, ingresa un correo electrónico válido");
      return;
    }

    setLoading(true);

    console.log("🔍 Auth config:", {
      authDomain: auth.config.authDomain,
      apiKey: auth.config.apiKey?.substring(0, 10) + "...",
      currentUser: auth.currentUser,
    });

    console.log("Intentando enviar correo a:", email);

    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });

      console.log("Correo enviado exitosamente según Firebase");

      setMessage(
        "Se ha enviado un enlace de recuperación a tu correo. " +
          "Por favor, revisa tu bandeja de entrada y la carpeta de spam.",
      );
      setEmail("");

      setTimeout(() => {
        navigate("/login");
      }, 5000);
    } catch (err: any) {
      console.error("❌ Error completo:", err);
      console.error("❌ Código de error:", err.code);
      console.error("❌ Mensaje:", err.message);

      let errorMessage = "No se pudo enviar el correo. Intenta nuevamente.";

      switch (err.code) {
        case "auth/user-not-found":
          errorMessage =
            "❌ No existe una cuenta con este correo. Por favor, regístrate primero.";
          console.log("💡 El usuario no existe en Firebase Authentication");
          break;
        case "auth/invalid-email":
          errorMessage = "El formato del correo electrónico es inválido";
          break;
        case "auth/too-many-requests":
          errorMessage =
            "Demasiados intentos. Espera unos minutos e intenta de nuevo";
          break;
        case "auth/network-request-failed":
          errorMessage = "Error de conexión. Verifica tu internet";
          break;
        case "auth/user-disabled":
          errorMessage = "Esta cuenta ha sido deshabilitada";
          break;
        case "auth/missing-continue-uri":
          errorMessage = "Error de configuración. Contacta al administrador.";
          console.error("💡 Falta configurar la URL de continuación");
          break;
        case "auth/invalid-continue-uri":
          errorMessage = "URL de redirección inválida";
          break;
        case "auth/unauthorized-continue-uri":
          errorMessage = "URL de redirección no autorizada";
          console.error("💡 Agrega la URL a dominios autorizados en Firebase");
          break;
        default:
          errorMessage = `Error: ${err.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="hero-topbar">
        <Link to="/">
          <img src={logo} className="topbar-logo" alt="Nexmeet Logo" />
          <span id="topbar-logo-text" className="topbar-logo-text">
            Nexmeet
          </span>
        </Link>
      </div>

      <div className="recover-container">
        <div className="recover-wrapper">
          <Link
            to="/login"
            className="back-arrow-recover"
            aria-label="Volver a inicio de sesión"
          >
            <span aria-hidden="true">←</span>
          </Link>

          <div className="recover-card">
            <h2>Recuperar contraseña</h2>
            <p className="recover-description">
              Ingresa tu correo electrónico y te enviaremos un enlace para
              restablecer tu contraseña.
            </p>

            <form onSubmit={handleRecover} noValidate>
              <label htmlFor="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                disabled={loading}
                required
                autoFocus
              />

              <button type="submit" disabled={loading || !email.trim()}>
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>
            </form>

            {message && <div className="success">{message}</div>}

            {error && <div className="error">{error}</div>}

            <div className="recover-footer">
              <p>
                ¿Recordaste tu contraseña?{" "}
                <Link to="/login" className="login-link">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecoverPassword;
