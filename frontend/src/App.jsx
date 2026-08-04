import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Hub from "./pages/Hub";
import AttendancePage from "./pages/AttendancePage";
import { logoutUser } from "./api/authApi";
import "./App.css";

function App() {
    const { user, logout } = useAuth();
    const [showRegister, setShowRegister] = useState(false);

    async function handleLogout() {
        await logoutUser();
        logout();
    }

    if (!user) {
        return showRegister ? (
            <Register onSwitchToLogin={() => setShowRegister(false)} />
        ) : (
            <Login onSwitchToRegister={() => setShowRegister(true)} />
        );
    }

    return (
        <Routes>
            <Route path="/" element={<Hub user={user} onLogout={handleLogout} />} />
            <Route path="/attendance" element={<AttendancePage user={user} onLogout={handleLogout} />} />
        </Routes>
    );
}

export default App;