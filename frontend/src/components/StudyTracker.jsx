import { useState, useEffect, useRef } from "react";

const DEFAULT_SUBJECTS = [
    "Mathematics",
    "Data Structures",
    "Physics",
    "Computer Networks",
    "General Study"
];

function formatTimerText(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatStartTime(date) {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function StudyTracker({ availableSubjects = [], onSessionComplete }) {
    const subjects = availableSubjects.length > 0 ? availableSubjects : DEFAULT_SUBJECTS;
    const [selectedSubject, setSelectedSubject] = useState(subjects[0] || "General Study");

    // Mode: "stopwatch" or "custom"
    const [mode, setMode] = useState("stopwatch");
    const [customMinutesInput, setCustomMinutesInput] = useState(25);

    // States: idle, running, paused, sessionEnded, inBreak
    const [sessionState, setSessionState] = useState("idle"); // "idle" | "running" | "paused" | "ended" | "break"
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [breakSeconds, setBreakSeconds] = useState(0);
    const [startTime, setStartTime] = useState(null);

    const timerRef = useRef(null);

    // Target seconds for custom mode
    const targetSeconds = mode === "custom" ? Math.max(1, Number(customMinutesInput) || 25) * 60 : 0;

    // Synchronize subject selection
    useEffect(() => {
        if (subjects.length > 0 && !subjects.includes(selectedSubject)) {
            setSelectedSubject(subjects[0]);
        }
    }, [availableSubjects]);

    // Timer Interval Effect
    useEffect(() => {
        if (sessionState === "running") {
            timerRef.current = setInterval(() => {
                setSecondsElapsed((prev) => {
                    const next = prev + 1;
                    if (mode === "custom" && targetSeconds > 0 && next >= targetSeconds) {
                        clearInterval(timerRef.current);
                        handleNaturalEnd(next);
                        return targetSeconds;
                    }
                    return next;
                });
            }, 1000);
        } else if (sessionState === "break") {
            timerRef.current = setInterval(() => {
                setBreakSeconds((prev) => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [sessionState, mode, targetSeconds]);

    // Natural end when custom countdown reaches zero
    function handleNaturalEnd(finalElapsedSeconds) {
        setSessionState("ended");
        const elapsedMins = Math.max(1, Math.round(finalElapsedSeconds / 60));
        if (onSessionComplete) {
            onSessionComplete({
                subject: selectedSubject,
                duration: elapsedMins,
                mode,
                date: new Date().toISOString(),
                completed: true
            });
        }
    }

    function handleStartSession() {
        setSecondsElapsed(0);
        setStartTime(new Date());
        setSessionState("running");
    }

    function handlePauseSession() {
        setSessionState("paused");
    }

    function handleResumeSession() {
        setSessionState("running");
    }

    function handleEndSession() {
        if (sessionState === "running" || sessionState === "paused" || secondsElapsed > 0) {
            setSessionState("ended");
            const elapsedMins = Math.max(1, Math.round(secondsElapsed / 60));
            const isFullyCompleted = mode === "custom" ? secondsElapsed >= targetSeconds : true;

            if (secondsElapsed > 10 && onSessionComplete) {
                onSessionComplete({
                    subject: selectedSubject,
                    duration: elapsedMins,
                    mode,
                    date: new Date().toISOString(),
                    completed: isFullyCompleted
                });
            }
        } else {
            setSessionState("idle");
        }
    }

    function handleStartBreak() {
        setBreakSeconds(0);
        setSessionState("break");
    }

    function handleEndBreak() {
        setBreakSeconds(0);
        setSessionState("idle");
        setSecondsElapsed(0);
        setStartTime(null);
    }

    function handleResetToIdle() {
        setSessionState("idle");
        setSecondsElapsed(0);
        setStartTime(null);
    }

    // Calculations for progress & time display
    let displaySeconds = 0;
    let progressPercent = 0;

    if (sessionState === "break") {
        displaySeconds = breakSeconds;
    } else if (mode === "stopwatch") {
        displaySeconds = secondsElapsed;
    } else {
        // Custom countdown mode
        const remaining = Math.max(0, targetSeconds - secondsElapsed);
        displaySeconds = remaining;
        progressPercent = targetSeconds > 0 ? Math.min(100, (secondsElapsed / targetSeconds) * 100) : 0;
    }

    const minsElapsedNum = Math.floor(secondsElapsed / 60);

    // Metadata line formatting
    let metadataText = "";
    if (sessionState === "break") {
        metadataText = `Optional break · ${Math.floor(breakSeconds / 60)} min elapsed`;
    } else if (sessionState === "running" || sessionState === "paused" || sessionState === "ended") {
        if (mode === "stopwatch") {
            metadataText = `${startTime ? `Started ${formatStartTime(startTime)} · ` : ""}${minsElapsedNum} min elapsed`;
        } else {
            const targetMins = Math.round(targetSeconds / 60);
            metadataText = `${startTime ? `Started ${formatStartTime(startTime)} · ` : ""}${minsElapsedNum} of ${targetMins} min`;
        }
    } else {
        metadataText = mode === "stopwatch" ? "Stopwatch mode · Count up" : `Custom duration · ${customMinutesInput} min target`;
    }

    const isActiveOrEnded = sessionState === "running" || sessionState === "paused" || sessionState === "ended";

    return (
        <div className="study-hero-card">
            {/* Header */}
            <div className="hero-card-header">
                <div>
                    <h2 className="hero-card-title">Study Session</h2>
                    <p className="hero-card-subtitle">Track your focus time, your way</p>
                </div>

                {/* Mode Selector Toggle (shown when idle) */}
                {sessionState === "idle" && (
                    <div className="mode-toggle-container">
                        <button
                            type="button"
                            className={`mode-toggle-btn ${mode === "stopwatch" ? "active" : ""}`}
                            onClick={() => setMode("stopwatch")}
                        >
                            Stopwatch
                        </button>
                        <button
                            type="button"
                            className={`mode-toggle-btn ${mode === "custom" ? "active" : ""}`}
                            onClick={() => setMode("custom")}
                        >
                            Custom Duration
                        </button>
                    </div>
                )}
            </div>

            {/* Custom Duration Minute Input (when idle & in custom mode) */}
            {sessionState === "idle" && mode === "custom" && (
                <div className="custom-duration-input-box">
                    <label className="custom-input-label">Target Duration (minutes):</label>
                    <input
                        type="number"
                        min="1"
                        max="360"
                        className="custom-duration-input"
                        value={customMinutesInput}
                        onChange={(e) => setCustomMinutesInput(Math.max(1, Number(e.target.value) || 1))}
                    />
                </div>
            )}

            {/* Subject Selector Bar */}
            <div className="subject-selector-section">
                <label className="subject-selector-label">Subject:</label>
                <div className="subject-chips-row">
                    {subjects.map((sub) => (
                        <button
                            key={sub}
                            type="button"
                            className={`subject-chip ${selectedSubject === sub ? "active" : ""}`}
                            onClick={() => {
                                if (sessionState === "idle") setSelectedSubject(sub);
                            }}
                            disabled={sessionState !== "idle"}
                        >
                            {sub}
                        </button>
                    ))}
                </div>
                <select
                    className="subject-dropdown-mobile"
                    value={selectedSubject}
                    onChange={(e) => sessionState === "idle" && setSelectedSubject(e.target.value)}
                    disabled={sessionState !== "idle"}
                >
                    {subjects.map((sub) => (
                        <option key={sub} value={sub}>
                            {sub}
                        </option>
                    ))}
                </select>
            </div>

            {/* Status Pill Badge */}
            <div className={`hero-status-pill ${sessionState === "break" ? "break-pill" : ""}`}>
                {sessionState === "break"
                    ? "ON BREAK · OPTIONAL BREAK"
                    : `NOW STUDYING · ${selectedSubject.toUpperCase()}`}
            </div>

            {/* Timer Display */}
            <div className="hero-timer-display">{formatTimerText(displaySeconds)}</div>

            {/* Plain-Text Metadata Line */}
            <div className="hero-metadata-line">{metadataText}</div>

            {/* Progress Bar (Custom duration mode only) */}
            {mode === "custom" && sessionState !== "break" && (
                <div className="hero-progress-container">
                    <div
                        className="hero-progress-bar-fill"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            )}

            {/* Action Buttons */}
            <div className="hero-actions-container">
                {sessionState === "idle" && (
                    <button
                        type="button"
                        className="hero-primary-btn"
                        onClick={handleStartSession}
                    >
                        Start Session
                    </button>
                )}

                {sessionState === "running" && (
                    <div className="hero-active-btn-group">
                        <button
                            type="button"
                            className="hero-primary-btn hero-pause-btn"
                            onClick={handlePauseSession}
                        >
                            Pause
                        </button>
                        <button
                            type="button"
                            className="hero-primary-btn hero-end-btn"
                            onClick={handleEndSession}
                        >
                            End Session
                        </button>
                    </div>
                )}

                {sessionState === "paused" && (
                    <div className="hero-active-btn-group">
                        <button
                            type="button"
                            className="hero-primary-btn"
                            onClick={handleResumeSession}
                        >
                            Resume
                        </button>
                        <button
                            type="button"
                            className="hero-secondary-btn"
                            onClick={handleEndSession}
                        >
                            End Session
                        </button>
                    </div>
                )}

                {sessionState === "ended" && (
                    <div className="hero-ended-options">
                        <p className="session-ended-note">Session logged! What would you like to do next?</p>
                        <div className="hero-ended-btn-group">
                            <button
                                type="button"
                                className="hero-primary-btn"
                                onClick={handleResetToIdle}
                            >
                                Start New Session
                            </button>
                            <button
                                type="button"
                                className="hero-secondary-break-btn"
                                onClick={handleStartBreak}
                            >
                                Start Break
                            </button>
                        </div>
                    </div>
                )}

                {sessionState === "break" && (
                    <button
                        type="button"
                        className="hero-primary-btn hero-end-break-btn"
                        onClick={handleEndBreak}
                    >
                        End Break & Return
                    </button>
                )}
            </div>
        </div>
    );
}

export default StudyTracker;
