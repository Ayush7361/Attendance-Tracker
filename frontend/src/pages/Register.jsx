import { useState } from "react";
import { registerUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

function Register({ onSwitchToLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        try {
            const res = await registerUser(username, password);
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
                    <div className="auth-field">
                        <label>Username</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" />
                    </div>
                    <div className="auth-field">
                        <label>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password" />
                    </div>
                    <button type="submit" className="auth-submit">Create Account</button>
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