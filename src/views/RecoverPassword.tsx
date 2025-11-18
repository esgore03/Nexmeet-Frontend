import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";
import "../styles/recoverPassword.scss";
import { Link } from "react-router-dom";

const RecoverPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Se ha enviado un enlace de recuperación a tu correo.");
    } catch (err: any) {
      setError("No se pudo enviar el correo, verifica el email.");
    }
  };

  return (
    <div className="recover-container">
      <div className="recover-card">
        <h2>Recuperar contraseña</h2>

        <form onSubmit={handleRecover}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit">Recuperar contraseña</button>
        </form>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <Link to="/login" className="back">
          Volver a inicio de sesión
        </Link>
      </div>
    </div>
  );
};

export default RecoverPassword;
