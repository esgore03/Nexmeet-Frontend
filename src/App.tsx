import { BrowserRouter, Route, Routes } from "react-router-dom";
import Landing from "./views/landing";
import Login from "./views/login";
import Register from "./views/register";
import Meeting from "./views/meeting";
import RecoverPassword from "./views/RecoverPassword";
import Profile from "./views/EditProfile";
import Dashboard from "./views/Dashboard";
import AboutUs from "./views/AboutUs";
import ViewProfile from "./views/Profile";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen relative">
        <Routes>
          {/* Páginas públicas */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Reuniones */}
          <Route path="/meeting/:meetingId" element={<Meeting />} />

          {/* Perfil */}
          <Route path="/recover-password" element={<RecoverPassword />} />
          <Route path="/profile" element={<ViewProfile />} />
          <Route path="/edit" element={<Profile />} />

          {/* Sobre nosotros */}
          <Route path="/about" element={<AboutUs />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
