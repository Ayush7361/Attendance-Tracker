import { useState } from "react";
import { joinClassWithCode } from "../api/teacherApi";
import { useToast } from "../context/ToastContext";

function ClassJoinModal({ onClose, onSuccess }) {
    const { showToast } = useToast();
    const [joinCode, setJoinCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        const code = joinCode.trim().toUpperCase();
        if (!code) return;

        setSubmitting(true);
        setError("");
        try {
            const res = await joinClassWithCode(code);
            if (showToast) showToast(res.message || "Enrolled successfully!", "success");
            if (onSuccess) onSuccess();
            if (onClose) onClose();
        } catch (err) {
            console.error("Failed to join class:", err);
            const msg = err.response?.data?.message || "Failed to join class. Invalid code.";
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <div className="card-panel" style={{ width: "100%", maxWidth: "420px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "16px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700" }}>Enroll in Class Cohort</h3>
                    <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
                </div>

                <p style={{ fontSize: "0.88rem", color: "#94a3b8", marginBottom: "16px" }}>
                    Enter the 6-digit Join Code provided by your teacher (e.g., <code>IT2-894A</code>) to link your student account to the class roster.
                </p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="e.g. IT2-894A"
                        style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            background: "rgba(15, 23, 42, 0.8)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            color: "#ffffff",
                            fontSize: "1.1rem",
                            fontWeight: "700",
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                            marginBottom: "16px"
                        }}
                    />

                    {error && <div style={{ color: "#f87171", fontSize: "0.85rem", marginBottom: "12px", fontWeight: "600" }}>{error}</div>}

                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                        <button type="button" onClick={onClose} style={{ padding: "10px 18px", borderRadius: "8px", background: "transparent", color: "#cbd5e1", border: "1px solid #334155", cursor: "pointer", fontWeight: "600" }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting || !joinCode.trim()} style={{ padding: "10px 20px", borderRadius: "8px", background: "#818cf8", color: "#ffffff", border: "none", cursor: "pointer", fontWeight: "700" }}>
                            {submitting ? "Joining..." : "Join Class"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ClassJoinModal;
