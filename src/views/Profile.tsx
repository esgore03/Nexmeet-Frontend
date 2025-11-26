import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Profile.scss";
import UserNavbar from "../components/UserNavbar";

/**
 * ViewProfile Component
 * Displays and manages user profile information
 * @returns {React.FC} Profile view component
 */
const ViewProfile: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    id: "",
    name: "",
    email: "",
    age: "",
    photoURL: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Ref for focus management
  const editButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  /**
   * Fetches user data from the backend API
   * Decodes JWT token to get user email and retrieves full user profile
   * @async
   */
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setError("No se encontró token de autenticación");
        setLoading(false);
        navigate("/login");
        return;
      }

      // Decode JWT token to get user email
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );

      const decoded = JSON.parse(jsonPayload);
      const userEmail = decoded.email;

      console.log("Email del token:", userEmail);

      // Fetch all users from backend
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        setError("Error al cargar los datos");
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log("Todos los usuarios:", data);

      // Debug: Log all user emails
      console.log(
        "Emails en BD:",
        data.users.map((u: any) => u.email),
      );

      // Find current user by email
      const currentUser = data.users.find((u: any) => u.email === userEmail);

      console.log("Usuario actual encontrado:", currentUser);

      if (currentUser) {
        setUserData({
          id: currentUser.id || "",
          name: currentUser.name || "",
          email: currentUser.email || "",
          age: currentUser.age?.toString() || "",
          photoURL: currentUser.photoURL || "",
        });

        // Save userId in localStorage for future use
        localStorage.setItem("userId", currentUser.id);
        console.log("✅ userId guardado en localStorage:", currentUser.id);
      } else {
        console.error("Usuario no encontrado. Email buscado:", userEmail);
        setError("Debes completar tu perfil para continuar.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error al procesar los datos del usuario");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigates to the profile edit page
   */
  const handleEditClick = () => {
    navigate("/edit");
  };

  /**
   * Automatically completes user profile with default values
   * @async
   */
  const handleCompleteProfile = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const userStr = localStorage.getItem("user");
      if (!userStr) {
        navigate("/login");
        return;
      }

      const user = JSON.parse(userStr);

      // Register user with default profile data
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: user.name || "Usuario",
            age: 25,
            photoURL: user.photoURL || null,
          }),
        },
      );

      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        setError(data.error || "Error al completar el perfil");
      }
    } catch (error) {
      console.error("Error al completar perfil:", error);
      setError("Error de conexión con el servidor");
    }
  };

  /**
   * Handles keyboard navigation
   * @param {React.KeyboardEvent} event - Keyboard event
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Allow Enter or Space to activate buttons
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const target = event.target as HTMLElement;
      if (target.tagName === "BUTTON") {
        target.click();
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
        <UserNavbar />
        <div className="profile-container">
          <div className="profile-wrapper">
            <Link
              to="/dashboard"
              className="back-arrow-profile"
              aria-label="Volver al dashboard"
            >
              <span aria-hidden="true">←</span>
            </Link>
            <div className="profile-box">
              <p
                className="profile-loading"
                role="status"
                aria-live="polite"
                aria-busy="true"
              >
                Cargando perfil...
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <UserNavbar />
        <div className="profile-container">
          <div className="profile-wrapper">
            <Link
              to="/dashboard"
              className="back-arrow-profile"
              aria-label="Volver al dashboard"
            >
              <span aria-hidden="true">←</span>
            </Link>
            <div className="profile-box">
              <h2 className="profile-title">Completa tu Perfil</h2>
              <p className="profile-error" role="alert" aria-live="assertive">
                {error}
              </p>
              <button
                className="profile-edit-btn"
                onClick={handleCompleteProfile}
                onKeyDown={handleKeyDown}
                style={{ marginTop: "1rem" }}
                aria-label="Completar perfil automáticamente"
                autoFocus
              >
                Completar perfil automáticamente
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <UserNavbar />

      <div className="profile-container">
        <div className="profile-wrapper">
          <Link
            to="/dashboard"
            className="back-arrow-profile"
            aria-label="Volver al dashboard"
          >
            <span aria-hidden="true">←</span>
          </Link>

          <div
            className="profile-box"
            role="main"
            aria-label="Información del perfil"
          >
            <h2 className="profile-title" id="profile-heading">
              Mi Perfil
            </h2>

            {userData.photoURL && (
              <div className="profile-photo-container">
                <img
                  src={userData.photoURL}
                  alt={`Foto de perfil de ${userData.name}`}
                  className="profile-photo"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      // Optional: Open photo in modal or full size
                      console.log("Photo focused/activated");
                    }
                  }}
                />
              </div>
            )}

            <div className="profile-field">
              <label className="profile-label" id="name-label">
                Nombre completo
              </label>
              <div
                className="profile-value"
                aria-labelledby="name-label"
                role="text"
              >
                {userData.name}
              </div>
            </div>

            <div className="profile-field">
              <label className="profile-label" id="email-label">
                Correo electrónico
              </label>
              <div
                className="profile-value"
                aria-labelledby="email-label"
                role="text"
              >
                {userData.email}
              </div>
            </div>

            <div className="profile-field">
              <label className="profile-label" id="age-label">
                Edad
              </label>
              <div
                className="profile-value"
                aria-labelledby="age-label"
                role="text"
              >
                {userData.age} años
              </div>
            </div>

            <button
              ref={editButtonRef}
              className="profile-edit-btn"
              onClick={handleEditClick}
              onKeyDown={handleKeyDown}
              aria-label="Editar información del perfil"
              type="button"
            >
              Editar perfil
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewProfile;
