import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.scss";
import UserNavbar from "../components/UserNavbar";

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

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setError("No se encontró token de autenticación");
        setLoading(false);
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

      console.log("Email del token:", userEmail);

      // ✅ CAMBIO: Usar el backend correcto (puerto 9000)
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

      // 🔍 DEBUG: Ver los emails de todos los usuarios
      console.log(
        "Emails en BD:",
        data.users.map((u: any) => u.email),
      );

      // Buscar el usuario actual por email
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

        // ✅ IMPORTANTE: Guardar userId en localStorage
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

  const handleEditClick = () => {
    navigate("/edit");
  };

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

      // ✅ CAMBIO: Usar el backend correcto
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

  if (loading) {
    return (
      <>
        <UserNavbar />
        <div className="profile-container">
          <div className="profile-box">
            <p className="profile-loading">Cargando perfil...</p>
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
            <h2 className="profile-title">Completa tu Perfil</h2>
            <p className="profile-error">{error}</p>
            <button
              className="profile-edit-btn"
              onClick={handleCompleteProfile}
              style={{ marginTop: "1rem" }}
            >
              Completar perfil automáticamente
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
          <h2 className="profile-title">Mi Perfil</h2>

          {userData.photoURL && (
            <div className="profile-photo-container">
              <img
                src={userData.photoURL}
                alt="Foto de perfil"
                className="profile-photo"
              />
            </div>
          )}

          <div className="profile-field">
            <label className="profile-label">Nombre completo</label>
            <div className="profile-value">{userData.name}</div>
          </div>

          <div className="profile-field">
            <label className="profile-label">Correo electrónico</label>
            <div className="profile-value">{userData.email}</div>
          </div>

          <div className="profile-field">
            <label className="profile-label">Edad</label>
            <div className="profile-value">{userData.age} años</div>
          </div>

          <button className="profile-edit-btn" onClick={handleEditClick}>
            Editar perfil
          </button>
        </div>
      </div>
    </>
  );
};

export default ViewProfile;
