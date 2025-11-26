import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/EditProfile.scss";
import UserNavbar from "../components/UserNavbar";
import {
  validatePassword,
  validatePasswordConfirmation,
} from "../utils/validators";
import { deleteUser } from "firebase/auth";
import { auth } from "../config/firebase";

/**
 * EditProfile Component
 *
 * This component allows authenticated users to:
 * - View and update their profile information (name, age, password)
 * - Delete their account permanently
 * - Sync updates between Firebase Authentication and the backend
 *
 * It includes form validation, API interaction, and modal confirmation for dangerous actions.
 *
 * @component
 * @returns {JSX.Element} Rendered edit profile page UI
 */
const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error" | "info">("info");
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  /**
   * Loads and decodes user data from the backend and populates form fields.
   * Redirects to login if no token is found.
   *
   * @async
   * @function loadUserData
   * @returns {Promise<void>}
   */
  const loadUserData = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        navigate("/login");
        return;
      }

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

      console.log("Cargando datos del usuario:", userEmail);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        setError("Error al cargar los datos");
        setLoadingData(false);
        return;
      }

      const data = await response.json();
      const currentUser = data.users.find((u: any) => u.email === userEmail);

      console.log("Usuario encontrado:", currentUser);

      if (currentUser) {
        setFormData({
          name: currentUser.name || "",
          email: currentUser.email || "",
          age: currentUser.age?.toString() || "",
          password: "",
          confirmPassword: "",
        });

        localStorage.setItem("userId", currentUser.id);
      } else {
        setError("No se encontraron datos del usuario");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setError("Error al cargar los datos del usuario");
    } finally {
      setLoadingData(false);
    }
  };

  /**
   * Handles form input changes by updating the local `formData` state.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input event
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  /**
   * Validates form input fields and updates the user data in the backend.
   * Optionally updates password in Firebase Authentication if provided.
   *
   * @async
   * @function handleSubmit
   * @returns {Promise<void>}
   */
  const handleSubmit = async () => {
    setMsg("");
    setError("");

    if (!formData.name.trim()) {
      setMsg("El nombre es requerido");
      setMsgType("error");
      return;
    }

    if (formData.name.trim().length < 2) {
      setMsg("El nombre debe tener al menos 2 caracteres");
      setMsgType("error");
      return;
    }

    if (formData.name.trim().length > 30) {
      setMsg("El nombre no puede tener más de 30 caracteres");
      setMsgType("error");
      return;
    }

    if (!formData.age || parseInt(formData.age) <= 0) {
      setMsg("La edad debe ser un número válido");
      setMsgType("error");
      return;
    }

    if (parseInt(formData.age) < 13) {
      setMsg("Debes tener al menos 13 años");
      setMsgType("error");
      return;
    }

    if (parseInt(formData.age) > 120) {
      setMsg("La edad no puede ser mayor a 120");
      setMsgType("error");
      return;
    }

    if (formData.password) {
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        setMsg(passwordError);
        setMsgType("error");
        return;
      }

      const confirmError = validatePasswordConfirmation(
        formData.password,
        formData.confirmPassword,
      );
      if (confirmError) {
        setMsg(confirmError);
        setMsgType("error");
        return;
      }
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("authToken");

      if (!userId || !token) {
        setMsg("Error: No se encontró información de sesión");
        setMsgType("error");
        setLoading(false);
        return;
      }

      const updates: any = {
        name: formData.name.trim(),
        age: parseInt(formData.age),
      };

      console.log("Actualizando usuario:", userId, updates);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/update/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        },
      );

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      if (response.ok) {
        setMsg("Perfil actualizado correctamente");
        setMsgType("success");

        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          user.name = formData.name;
          user.age = parseInt(formData.age);
          localStorage.setItem("user", JSON.stringify(user));
        }

        if (formData.password) {
          try {
            const { updatePassword } = await import("firebase/auth");
            const { auth } = await import("../config/firebase");

            const user = auth.currentUser;
            if (user) {
              await updatePassword(user, formData.password);
              console.log("Contraseña actualizada en Firebase Auth");
            }
          } catch (authError: any) {
            console.error(
              "Error al actualizar contraseña en Firebase:",
              authError,
            );

            if (authError.code === "auth/requires-recent-login") {
              setMsg(
                "Perfil actualizado, pero debes volver a iniciar sesión para cambiar la contraseña",
              );
              setMsgType("info");
            }
          }
        }

        setTimeout(() => navigate("/profile"), 2000);
      } else {
        setMsg(data.error || "Error al actualizar el perfil");
        setMsgType("error");
      }
    } catch (error) {
      console.error("Error:", error);
      setMsg("Error de conexión con el servidor");
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the complete user account deletion process:
   * - Deletes the user from backend
   * - Deletes Firebase Authentication account
   * - Clears localStorage
   * - Redirects to home page
   *
   * @async
   * @function handleDeleteAccount
   * @returns {Promise<void>}
   */
  const handleDeleteAccount = async () => {
    setLoadingDelete(true);
    setMsg("");
    setError("");

    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("authToken");

      if (!userId || !token) {
        setMsg("Error: No se encontró información de sesión");
        setMsgType("error");
        setLoadingDelete(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/delete/${userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar cuenta del backend");
      }

      const user = auth.currentUser;
      if (user) {
        await deleteUser(user);
        console.log("✅ Usuario eliminado de Firebase Auth");
      }

      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");

      alert("✅ Tu cuenta ha sido eliminada exitosamente");
      navigate("/");
    } catch (error: any) {
      console.error("Error eliminando cuenta:", error);

      let errorMessage = "Error al eliminar la cuenta. Intenta nuevamente.";

      if (error.code === "auth/requires-recent-login") {
        errorMessage =
          "Por seguridad, debes volver a iniciar sesión antes de eliminar tu cuenta.";

        setTimeout(() => {
          localStorage.clear();
          navigate("/login");
        }, 3000);
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMsg(errorMessage);
      setMsgType("error");
    } finally {
      setLoadingDelete(false);
      setShowDeleteModal(false);
    }
  };

  if (loadingData) {
    return (
      <>
        <UserNavbar />
        <div className="profile-container">
          <div className="profile-wrapper">
            <Link
              to="/profile"
              className="back-arrow-edit"
              aria-label="Volver al perfil"
            >
              <span aria-hidden="true">←</span>
            </Link>
            <div className="profile-box">
              <p className="profile-loading">Cargando datos...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <UserNavbar />
        <div className="profile-container">
          <div className="profile-wrapper">
            <Link
              to="/profile"
              className="back-arrow-edit"
              aria-label="Volver al perfil"
            >
              <span aria-hidden="true">←</span>
            </Link>
            <div className="profile-box">
              <h2 className="profile-title">Error</h2>
              <p className="profile-error-text">{error}</p>
              <button
                className="profile-save-btn"
                onClick={() => navigate("/profile")}
              >
                Volver al perfil
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
            to="/profile"
            className="back-arrow-edit"
            aria-label="Volver al perfil"
          >
            <span aria-hidden="true">←</span>
          </Link>

          <div className="profile-box">
            <h2 className="profile-title">Editar Perfil</h2>

            <label className="profile-label">Nombre completo</label>
            <input
              id="name"
              type="text"
              className="profile-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="Tu nombre completo"
            />

            <label className="profile-label">Correo electrónico</label>
            <input
              id="email"
              type="email"
              className="profile-input profile-input-disabled"
              value={formData.email}
              onChange={handleChange}
              disabled
              title="El correo no se puede modificar"
            />

            <label className="profile-label">Edad</label>
            <input
              id="age"
              type="number"
              className="profile-input"
              value={formData.age}
              onChange={handleChange}
              placeholder="Tu edad"
              min="13"
              max="120"
            />

            <label className="profile-label">Nueva contraseña (opcional)</label>
            <input
              id="password"
              type="password"
              className="profile-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Dejar en blanco para no cambiar"
            />

            <label className="profile-label">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              className={`profile-input ${!formData.password ? "profile-input-inactive" : ""}`}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirma tu nueva contraseña"
              disabled={!formData.password}
            />

            <div className="profile-button-group">
              <button
                className="profile-save-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>

              <button
                className="profile-cancel-btn"
                onClick={() => navigate("/profile")}
                disabled={loading}
              >
                Cancelar
              </button>
            </div>

            {msg && (
              <p className={`profile-msg profile-msg-${msgType}`}>{msg}</p>
            )}

            <div className="danger-zone">
              <button
                className="profile-delete-btn"
                onClick={() => setShowDeleteModal(true)}
                disabled={loading || loadingDelete}
              >
                Eliminar cuenta
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">⚠️ ¿Estás seguro?</h2>
            <p className="modal-description">
              Esta acción <strong>no se puede deshacer</strong>. Se eliminarán:
            </p>
            <ul className="modal-list">
              <li>✗ Tu cuenta y toda tu información personal</li>
              <li>✗ Tu historial de reuniones</li>
              <li>✗ Todos tus datos almacenados</li>
            </ul>
            <p className="modal-warning">
              Escribe "<strong>ELIMINAR</strong>" para confirmar:
            </p>
            <input
              type="text"
              id="confirmDelete"
              className="modal-input"
              placeholder="Escribe ELIMINAR"
              onKeyPress={(e) => {
                if (
                  e.key === "Enter" &&
                  (e.target as HTMLInputElement).value === "ELIMINAR"
                ) {
                  handleDeleteAccount();
                }
              }}
            />
            <div className="modal-buttons">
              <button
                className="modal-cancel-btn"
                onClick={() => setShowDeleteModal(false)}
                disabled={loadingDelete}
              >
                Cancelar
              </button>
              <button
                className="modal-delete-btn"
                onClick={() => {
                  const input = document.getElementById(
                    "confirmDelete",
                  ) as HTMLInputElement;
                  if (input.value === "ELIMINAR") {
                    handleDeleteAccount();
                  } else {
                    alert('Por favor, escribe "ELIMINAR" para confirmar');
                  }
                }}
                disabled={loadingDelete}
              >
                {loadingDelete ? "Eliminando..." : "Sí, eliminar mi cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditProfile;
