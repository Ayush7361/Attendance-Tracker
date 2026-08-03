import { useState } from "react";
import { loginUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

function Login({ onSwitchToRegister }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        try {
            const res = await loginUser(username, password);
            login(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-brand">
                <div className="auth-logo">Attendance Dashboard</div>
                <h1 className="auth-headline">Track every class,<br />miss nothing.</h1>
                <p className="auth-subtext">
                    Log your weekly attendance and keep an eye on your percentage, all in one place.
                </p>
            </div>

            <div className="auth-form-side">
                <h2>Welcome back</h2>

                <form onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label>Username</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" />
                    </div>
                    <div className="auth-field">
                        <label>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
                    </div>
                    <button type="submit" className="auth-submit">Log In</button>
                </form>

                {error && <div className="auth-error">{error}</div>}

                <div className="auth-switch">
                    Don't have an account? <span className="link" onClick={onSwitchToRegister}>Register</span>
                </div>
            </div>
        </div>
    );
}

export default Login;