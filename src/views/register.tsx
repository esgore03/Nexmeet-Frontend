/**
 * @file Register.tsx
 * @description Registration page component for Nexmeet. Handles new user creation,
 * form validation, backend integration, and success/error feedback via popup messages.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Register.scss";
import { Link } from "react-router-dom";
import { validateRegisterForm } from "../utils/validators";
import discord from "../assets/discord.webp"; // ✅ Cambio aquí
import github from "../assets/github.png";
import google from "../assets/google.png";
import logo from "../assets/logo.png";
import { signInWithPopup, createUserWithEmailAndPassword } from "firebase/auth";
import {
  auth,
  googleProvider,
  discordProvider, // ✅ Cambio aquí
  githubProvider,
} from "../config/firebase";
import { httpClient } from "../utils/httpClient";
import { API_ENDPOINTS } from "../utils/constants";

/**
 * Displays a temporary popup message for successful actions.
 * Automatically hides the popup after 3 seconds.
 *
 * @param {string} message - The success message to display.
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
 * Register component for user account creation.
 * Handles input changes, validation, submission, and feedback.
 *
 * @component
 * @returns {JSX.Element} The rendered registration form.
 */
const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });

    const { [e.target.id]: removed, ...rest } = errors;
    setErrors(rest);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const { isValid, errors: validationErrors } =
      validateRegisterForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      // 1️⃣ Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      const user = userCredential.user;
      const token = await user.getIdToken();

      localStorage.setItem("authToken", token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.uid,
          email: user.email,
          name: formData.name,
          photoURL: null,
        }),
      );

      await httpClient.post(API_ENDPOINTS.REGISTER, {
        name: formData.name,
        age: Number(formData.age),
        photoURL: null,
      });

      showSuccess("¡Registro exitoso! Redirigiendo...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: any) {
      console.error("Error en registro:", error);

      let errorMessage = "Error al registrar usuario";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email ya está registrado";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "La contraseña debe tener al menos 6 caracteres";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "El formato del email es inválido";
      } else if (error.code === "auth/operation-not-allowed") {
        errorMessage = "El registro con email/password no está habilitado";
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = async (provider: any) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const token = await user.getIdToken();

      const userName =
        user.displayName || user.email?.split("@")[0] || "Usuario";

      // 2️⃣ Guardar token y datos en localStorage
      localStorage.setItem("authToken", token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.uid,
          email: user.email,
          name: userName,
          photoURL: user.photoURL,
        }),
      );

      // 3️⃣ Registrar en tu backend
      await httpClient.post(API_ENDPOINTS.REGISTER, {
        name: userName,
        photoURL: user.photoURL,
        age: 25,
      });

      showSuccess("¡Registro exitoso! Redirigiendo...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: any) {
      console.error("Error en registro social:", error);

      if (error?.code === "auth/account-exists-with-different-credential") {
        setFormError(
          "Ya existe una cuenta con este email usando otro método de inicio de sesión. Por favor, usa ese método.",
        );
        return;
      }

      if (error?.code === "auth/popup-closed-by-user") {
        setFormError("El proceso de registro fue cancelado");
        return;
      }

      if (error?.code === "auth/cancelled-popup-request") {
        return;
      }

      setFormError(
        error?.data?.error ||
          error?.message ||
          "Hubo un error al registrarte con el proveedor social.",
      );
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
      <div className="app-container-register">
        <div className="main-content-register">
          <div className="left-section-register">
            <div className="register-wrapper">
              <Link
                to="/"
                className="back-arrow"
                aria-label="Volver a la página principal"
              >
                <span aria-hidden="true">←</span>
              </Link>

              <div className="register-box">
                <h2>Regístrate y crea tu cuenta</h2>

                <form className="form" onSubmit={handleSubmit} noValidate>
                  <label htmlFor="name">Nombre</label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Tu nombre completo"
                    className="input"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                    aria-label="Ingresa tu nombre completo"
                    aria-required="true"
                    aria-invalid={errors.name ? "true" : "false"}
                  />
                  {errors.name && (
                    <span className="error-message" role="alert">
                      {errors.name}
                    </span>
                  )}

                  <div className="form-row">
                    <div style={{ flex: 3 }}>
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
                    </div>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="age">Edad</label>
                      <input
                        type="number"
                        id="age"
                        placeholder="Tu edad"
                        className="input"
                        value={formData.age}
                        onChange={handleChange}
                        disabled={loading}
                        min={0}
                        aria-label="Ingresa tu edad"
                        aria-required="true"
                        aria-invalid={errors.age ? "true" : "false"}
                      />
                      {errors.age && (
                        <span className="error-message" role="alert">
                          {errors.age}
                        </span>
                      )}
                    </div>
                  </div>

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

                  <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    placeholder="********"
                    className="input"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    aria-label="Confirma tu contraseña"
                    aria-required="true"
                    aria-invalid={errors.confirmPassword ? "true" : "false"}
                  />
                  {errors.confirmPassword && (
                    <span className="error-message" role="alert">
                      {errors.confirmPassword}
                    </span>
                  )}

                  <button
                    type="submit"
                    className="button"
                    disabled={loading}
                    aria-label={loading ? "Registrando usuario" : "Registrarse"}
                  >
                    {loading ? "Registrando..." : "Registrarse"}
                  </button>

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
                  {formSuccess && (
                    <div
                      className="success-message"
                      style={{ marginTop: 8, color: "green" }}
                      role="status"
                      aria-live="polite"
                    >
                      {formSuccess}
                    </div>
                  )}
                </form>

                <div className="login-redirect">
                  ¿Ya tienes cuenta?{" "}
                  <a href="/login" className="login-link">
                    Inicia sesión aquí
                  </a>
                </div>

                {/* Redes sociales */}
                <div className="social-media-container">
                  <button
                    type="button"
                    className="social-link"
                    onClick={() => handleSocialRegister(googleProvider)}
                    aria-label="Registrarse con Google"
                  >
                    <img
                      src={google}
                      className="social-logo"
                      alt="Google Logo"
                    />
                  </button>
                  {/* ✅ Cambio aquí: Discord en lugar de Facebook */}
                  <button
                    type="button"
                    className="social-link"
                    onClick={() => handleSocialRegister(discordProvider)}
                    aria-label="Registrarse con Discord"
                  >
                    <img
                      src={discord}
                      className="social-logo"
                      alt="Discord Logo"
                    />
                  </button>
                  <button
                    type="button"
                    className="social-link"
                    onClick={() => handleSocialRegister(githubProvider)}
                    aria-label="Registrarse con GitHub"
                  >
                    <img
                      src={github}
                      className="social-logo"
                      alt="Github Logo"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
