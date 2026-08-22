import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { StudyTimerProvider } from "./context/StudyTimerContext";
import "./App.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <StudyTimerProvider>
                        <App />
                    </StudyTimerProvider>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
);