import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Hub from "./pages/Hub";
import TeacherDashboard from "./pages/TeacherDashboard";
import AttendancePage from "./pages/AttendancePage";
import DeadlinesPage from "./pages/DeadlinesPage";
import DeadlineDetailPage from "./pages/DeadlineDetailPage";
import DeadlineFormPage from "./pages/DeadlineFormPage";
import AcademicTimelinePage from "./pages/AcademicTimelinePage";
import StudyPage from "./pages/StudyPage";
import GpaPage from "./pages/GpaPage";
import RoutinePage from "./pages/RoutinePage";
import ArchivePage from "./pages/ArchivePage";
import MobileNav from "./components/MobileNav";
import GlobalMiniTimer from "./components/GlobalMiniTimer";
import { logoutUser } from "./api/authApi";
import "./App.css";

function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, [pathname]);

    return null;
}

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

    if (user.role === "teacher") {
        return (
            <>
                <ScrollToTop />
                <Routes>
                    <Route path="*" element={<TeacherDashboard user={user} onLogout={handleLogout} />} />
                </Routes>
            </>
        );
    }

    return (
        <>
            <ScrollToTop />
            <GlobalMiniTimer />
            <Routes>
                <Route path="/" element={<Hub user={user} onLogout={handleLogout} />} />
                <Route path="/attendance" element={<AttendancePage user={user} onLogout={handleLogout} />} />
                <Route path="/deadlines" element={<DeadlinesPage user={user} onLogout={handleLogout} />} />
                <Route path="/deadlines/new" element={<DeadlineFormPage user={user} onLogout={handleLogout} />} />
                <Route path="/deadlines/:id/edit" element={<DeadlineFormPage user={user} onLogout={handleLogout} />} />
                <Route path="/deadlines/:id" element={<DeadlineDetailPage user={user} onLogout={handleLogout} />} />
                <Route path="/timeline" element={<AcademicTimelinePage user={user} onLogout={handleLogout} />} />
                <Route path="/study" element={<StudyPage user={user} onLogout={handleLogout} />} />
                <Route path="/gpa" element={<GpaPage user={user} onLogout={handleLogout} />} />
                <Route path="/schedule" element={<RoutinePage user={user} onLogout={handleLogout} />} />
                <Route path="/archive" element={<ArchivePage user={user} onLogout={handleLogout} />} />
            </Routes>
            <MobileNav />
        </>
    );
}

export default App;
