import { useState, useEffect, useRef } from "react";

// Configurable constants - not hardcoded magic numbers
export const TIMER_CONFIG = {
    FOCUS_MINUTES: 25,
    SHORT_BREAK_MINUTES: 5,
    LONG_BREAK_MINUTES: 15,
    CYCLES_BEFORE_LONG_BREAK: 4
};

const DEFAULT_SUBJECTS = [
    "Mathematics",
    "Data Structures",
    "Physics",
    "Computer Networks",
    "General Study"
];

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatStartTime(date) {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function StudyTimer({ availableSubjects = [], onSessionComplete }) {
    // Subject selection
    const subjects = availableSubjects.length > 0 ? availableSubjects : DEFAULT_SUBJECTS;
    const [selectedSubject, setSelectedSubject] = useState(subjects[0] || "General Study");

    // Timer states: mode ("focus" | "shortBreak" | "longBreak")
    const [mode, setMode] = useState("focus");
    const [isRunning, setIsRunning] = useState(false);
    const [cycleCount, setCycleCount] = useState(0);

    // Duration calculation in seconds
    const targetMinutes =
        mode === "focus"
            ? TIMER_CONFIG.FOCUS_MINUTES
            : mode === "shortBreak"
            ? TIMER_CONFIG.SHORT_BREAK_MINUTES
            : TIMER_CONFIG.LONG_BREAK_MINUTES;

    const targetSeconds = targetMinutes * 60;
    const [secondsLeft, setSecondsLeft] = useState(targetSeconds);
    const [startTime, setStartTime] = useState(null);

    // Ref to hold interval timer
    const timerRef = useRef(null);

    // Update secondsLeft if target change while idle
    useEffect(() => {
        if (!isRunning && secondsLeft === targetSeconds) {
            setSecondsLeft(targetSeconds);
        }
    }, [mode, targetSeconds]);

    // Keep selected subject valid if availableSubjects changes
    useEffect(() => {
        if (subjects.length > 0 && !subjects.includes(selectedSubject)) {
            setSelectedSubject(subjects[0]);
        }
    }, [availableSubjects]);

    // Timer countdown effect
    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setSecondsLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleTimerNaturalEnd();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning, mode, selectedSubject]);

    // Auto-log session when timer finishes naturally
    function handleTimerNaturalEnd() {
        setIsRunning(false);

        if (mode === "focus") {
            const newCycleCount = cycleCount + 1;
            setCycleCount(newCycleCount);

            // Log focus session automatically
            if (onSessionComplete) {
                onSessionComplete({
                    subject: selectedSubject,
                    duration: TIMER_CONFIG.FOCUS_MINUTES,
                    date: new Date().toISOString(),
                    completed: true
                });
            }

            // Switch to break
            if (newCycleCount % TIMER_CONFIG.CYCLES_BEFORE_LONG_BREAK === 0) {
                setMode("longBreak");
                setSecondsLeft(TIMER_CONFIG.LONG_BREAK_MINUTES * 60);
            } else {
                setMode("shortBreak");
                setSecondsLeft(TIMER_CONFIG.SHORT_BREAK_MINUTES * 60);
            }
        } else {
            // Break completed -> back to focus mode
            setMode("focus");
            setSecondsLeft(TIMER_CONFIG.FOCUS_MINUTES * 60);
        }
        setStartTime(null);
    }

    function handleStart() {
        if (!startTime) {
            setStartTime(new Date());
        }
        setIsRunning(true);
    }

    function handlePause() {
        setIsRunning(false);
    }

    function handleEndEarly() {
        if (isRunning || secondsLeft < targetSeconds) {
            setIsRunning(false);

            // Calculate elapsed minutes if in focus mode
            const elapsedSeconds = targetSeconds - secondsLeft;
            const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

            if (mode === "focus" && elapsedSeconds > 10 && onSessionComplete) {
                onSessionComplete({
                    subject: selectedSubject,
                    duration: elapsedMinutes,
                    date: new Date().toISOString(),
                    completed: false
                });
            }
        }

        // Reset state
        setSecondsLeft(targetSeconds);
        setStartTime(null);
    }

    function handleModeChange(newMode) {
        if (isRunning) {
            if (!window.confirm("Changing mode will reset the current active timer. Continue?")) {
                return;
            }
            setIsRunning(false);
        }
        setMode(newMode);
        const mins =
            newMode === "focus"
                ? TIMER_CONFIG.FOCUS_MINUTES
                : newMode === "shortBreak"
                ? TIMER_CONFIG.SHORT_BREAK_MINUTES
                : TIMER_CONFIG.LONG_BREAK_MINUTES;
        setSecondsLeft(mins * 60);
        setStartTime(null);
    }

    // Calculations for progress & metadata
    const elapsedSeconds = targetSeconds - secondsLeft;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const progressPercent = Math.min(100, Math.max(0, (elapsedSeconds / targetSeconds) * 100));

    // Plain text metadata line
    const metadataText = isRunning || secondsLeft < targetSeconds
        ? `${startTime ? `Started ${formatStartTime(startTime)} · ` : ""}${elapsedMinutes} of ${targetMinutes} min`
        : `Target: ${targetMinutes} min · Cycle ${cycleCount + 1}`;

    return (
        <div className="study-hero-card">
            <div className="hero-card-header">
                <div>
                    <h2 className="hero-card-title">Study Session</h2>
                    <p className="hero-card-subtitle">Track your focus time, subject by subject</p>
                </div>
                <div className="mode-tabs-container">
                    <button
                        type="button"
                        className={`mode-tab-btn ${mode === "focus" ? "active" : ""}`}
                        onClick={() => handleModeChange("focus")}
                    >
                        Focus
                    </button>
                    <button
                        type="button"
                        className={`mode-tab-btn ${mode === "shortBreak" ? "active" : ""}`}
                        onClick={() => handleModeChange("shortBreak")}
                    >
                        Short Break
                    </button>
                    <button
                        type="button"
                        className={`mode-tab-btn ${mode === "longBreak" ? "active" : ""}`}
                        onClick={() => handleModeChange("longBreak")}
                    >
                        Long Break
                    </button>
                </div>
            </div>

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
                                if (!isRunning) setSelectedSubject(sub);
                            }}
                            disabled={isRunning}
                        >
                            {sub}
                        </button>
                    ))}
                </div>
                <select
                    className="subject-dropdown-mobile"
                    value={selectedSubject}
                    onChange={(e) => !isRunning && setSelectedSubject(e.target.value)}
                    disabled={isRunning}
                >
                    {subjects.map((sub) => (
                        <option key={sub} value={sub}>
                            {sub}
                        </option>
                    ))}
                </select>
            </div>

            {/* Status Pill Label */}
            <div className="hero-status-pill">
                {mode === "focus"
                    ? `NOW STUDYING · ${selectedSubject.toUpperCase()}`
                    : `ON BREAK · ${mode === "shortBreak" ? "SHORT BREAK" : "LONG BREAK"}`}
            </div>

            {/* Large Timer Display */}
            <div className="hero-timer-display">{formatTime(secondsLeft)}</div>

            {/* Metadata Line */}
            <div className="hero-metadata-line">{metadataText}</div>

            {/* Progress Bar */}
            <div className="hero-progress-container">
                <div
                    className="hero-progress-bar-fill"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Primary Action Controls */}
            <div className="hero-actions-container">
                {!isRunning ? (
                    <button
                        type="button"
                        className="hero-primary-btn"
                        onClick={handleStart}
                    >
                        {secondsLeft < targetSeconds ? "Resume Session" : "Start Session"}
                    </button>
                ) : (
                    <div className="hero-active-btn-group">
                        <button
                            type="button"
                            className="hero-primary-btn hero-pause-btn"
                            onClick={handlePause}
                        >
                            Pause
                        </button>
                        <button
                            type="button"
                            className="hero-secondary-btn"
                            onClick={handleEndEarly}
                        >
                            End Session
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudyTimer;
