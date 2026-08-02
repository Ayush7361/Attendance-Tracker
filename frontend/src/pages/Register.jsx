import { useState } from "react";
import { registerUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

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
            setError("Username already taken");
        }
    }

    return (
        <div className="auth-form">
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Register</button>
            </form>
            {error && <p className="error">{error}</p>}
            <p>
                Already have an account?{" "}
                <span className="link" onClick={onSwitchToLogin}>Login</span>
            </p>
        </div>
    );
}

export default Register;