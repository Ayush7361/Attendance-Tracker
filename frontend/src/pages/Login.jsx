import { useState } from "react";
import { loginUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

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
            setError("Invalid username or password");
        }
    }

    return (
        <div className="auth-form">
            <h2>Login</h2>
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
                <button type="submit">Login</button>
            </form>
            {error && <p className="error">{error}</p>}
            <p>
                Don't have an account?{" "}
                <span className="link" onClick={onSwitchToRegister}>Register</span>
            </p>
        </div>
    );
}

export default Login;