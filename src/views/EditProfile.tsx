import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/EditProfile.scss";
import UserNavbar from "../components/UserNavbar";
import {
  validatePassword,
  validatePasswordConfirmation,
} from "../utils/validators";

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
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error" | "info">("info");
  const [error, setError] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        navigate("/login");
        return;
      }

      // Decodificar el token para obtener el email
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

      // Obtener todos los usuarios
      const response = await fetch("http://localhost:3000/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setError("Error al cargar los datos");
        setLoadingData(false);
        return;
      }

      const data = await response.json();

      // Buscar el usuario actual por email
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

        // Guardar el userId para la actualización
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    setMsg("");
    setError("");

    // Validaciones básicas
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

    // Validación de contraseña si se proporcionó
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
        `http://localhost:3000/api/users/update/${userId}`,
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

        // Actualizar localStorage con los nuevos datos
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          user.name = formData.name;
          user.age = parseInt(formData.age);
          localStorage.setItem("user", JSON.stringify(user));
        }

        // Si se cambió la contraseña, actualizar en Firebase Auth
        if (formData.password) {
          try {
            // Importar Firebase Auth
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

            // Si el error es por re-autenticación requerida
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

  if (loadingData) {
    return (
      <>
        <UserNavbar />
        <div className="profile-container">
          <div className="profile-box">
            <p className="profile-loading">Cargando datos...</p>
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
      </>
    );
  }

  return (
    <>
      <UserNavbar />

      <div className="profile-container">
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

          <label className="profile-label">
            Nueva contraseña (opcional)
            <span className="profile-label-hint">
              - Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 símbolo especial
            </span>
          </label>
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

          {msg && <p className={`profile-msg profile-msg-${msgType}`}>{msg}</p>}
        </div>
      </div>
    </>
  );
};

export default EditProfile;
