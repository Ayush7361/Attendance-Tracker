import { useState } from "react";
import { registerUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

function Register({ onSwitchToLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("student");
    const [error, setError] = useState("");
    const { login } = useAuth();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        try {
            const res = await registerUser(username, password, role);
            login(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-brand">
                <div className="auth-logo">Study Dashboard</div>
                <h1 className="auth-headline">Everything you need<br />to stay on track.</h1>
                <p className="auth-subtext">
                    Create an account to organize deadlines, log attendance, and plan important dates from one dashboard.
                </p>
            </div>

            <div className="auth-form-side">
                <h2>Create your account</h2>

                <form onSubmit={handleSubmit}>
                    <div className="auth-field" style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Account Type</label>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                type="button"
                                onClick={() => setRole("student")}
                                style={{
                                    flex: 1,
                                    padding: "10px",
                                    borderRadius: "8px",
                                    border: role === "student" ? "2px solid #818cf8" : "1px solid rgba(255,255,255,0.15)",
                                    background: role === "student" ? "rgba(129, 140, 248, 0.2)" : "rgba(15, 23, 42, 0.6)",
                                    color: role === "student" ? "#818cf8" : "#cbd5e1",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                🎓 Student
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("teacher")}
                                style={{
                                    flex: 1,
                                    padding: "10px",
                                    borderRadius: "8px",
                                    border: role === "teacher" ? "2px solid #818cf8" : "1px solid rgba(255,255,255,0.15)",
                                    background: role === "teacher" ? "rgba(129, 140, 248, 0.2)" : "rgba(15, 23, 42, 0.6)",
                                    color: role === "teacher" ? "#818cf8" : "#cbd5e1",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                👨‍🏫 Teacher
                            </button>
                        </div>
                    </div>

                    <div className="auth-field">
                        <label>Username</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" required />
                    </div>
                    <div className="auth-field">
                        <label>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password" required />
                    </div>
                    <button type="submit" className="auth-submit">Create Account ({role === "teacher" ? "Teacher" : "Student"})</button>
                </form>

                {error && <div className="auth-error">{error}</div>}

                <div className="auth-switch">
                    Already have an account? <span className="link" onClick={onSwitchToLogin}>Login</span>
                </div>
            </div>
        </div>
    );
}

export default Register;