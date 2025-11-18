import React, { useState } from "react";
import "../styles/Profile.scss";
import UserNavbar from "../components/UserNavbar"; 

const Profile: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    setMsg("");

    if (formData.password !== formData.confirmPassword) {
      setMsg("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/update-profile/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMsg("Perfil actualizado correctamente.");
      } else {
        setMsg(data.error || "Error al actualizar el perfil.");
      }
    } catch (error) {
      setMsg("Error de conexión con el servidor.");
    }

    setLoading(false);
  };

  return (
    <>
     
      <UserNavbar />

      <div className="profile-container">
        <div className="profile-box">
          <h2 className="profile-title">Mi Perfil</h2>
          <label className="profile-label">Nombre completo</label>
          <input
            id="name"
            type="text"
            className="profile-input"
            value={formData.name}
            onChange={handleChange}
          />

          <label className="profile-label">Correo electrónico</label>
          <input
            id="email"
            type="email"
            className="profile-input"
            value={formData.email}
            onChange={handleChange}
          />

          <label className="profile-label">Edad</label>
          <input
            id="age"
            type="number"
            className="profile-input"
            value={formData.age}
            onChange={handleChange}
          />

          <label className="profile-label">Nueva contraseña</label>
          <input
            id="password"
            type="password"
            className="profile-input"
            value={formData.password}
            onChange={handleChange}
          />

          <label className="profile-label">Confirmar contraseña</label>
          <input
            id="confirmPassword"
            type="password"
            className="profile-input"
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          <button className="profile-save-btn" onClick={handleSubmit}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>

          {msg && (
            <p className="profile-msg">{msg}</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;