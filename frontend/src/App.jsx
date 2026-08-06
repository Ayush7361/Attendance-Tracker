import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Hub from "./pages/Hub";
import AttendancePage from "./pages/AttendancePage";
import DeadlinesPage from "./pages/DeadlinesPage";
import DeadlineDetailPage from "./pages/DeadlineDetailPage";
import DeadlineFormPage from "./pages/DeadlineFormPage";
import AcademicTimelinePage from "./pages/AcademicTimelinePage";
import StudyPage from "./pages/StudyPage";
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
            <Route path="/deadlines" element={<DeadlinesPage user={user} onLogout={handleLogout} />} />
            <Route path="/deadlines/new" element={<DeadlineFormPage user={user} onLogout={handleLogout} />} />
            <Route path="/deadlines/:id/edit" element={<DeadlineFormPage user={user} onLogout={handleLogout} />} />
            <Route path="/deadlines/:id" element={<DeadlineDetailPage user={user} onLogout={handleLogout} />} />
            <Route path="/timeline" element={<AcademicTimelinePage user={user} onLogout={handleLogout} />} />
            <Route path="/study" element={<StudyPage user={user} onLogout={handleLogout} />} />
        </Routes>
    );
}

export default App;