import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem("user");
        try {
            return stored ? JSON.parse(stored) : null;
        } catch {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            return null;
        }
    });

    useEffect(() => {
        const handleUnauthorized = () => setUser(null);
        window.addEventListener("study-dashboard:unauthorized", handleUnauthorized);
        return () => window.removeEventListener("study-dashboard:unauthorized", handleUnauthorized);
    }, []);

    function login(userData) {
        localStorage.setItem("token", userData.token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// This hook is intentionally colocated with its provider for the small app context API.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    return useContext(AuthContext);
}
