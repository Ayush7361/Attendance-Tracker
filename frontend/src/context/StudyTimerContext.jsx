import React, { createContext, useState, useEffect, useContext, useRef } from "react";
import { saveStudySession } from "../api/studyApi";

const MODE_PRESETS = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    stopwatch: 0
};

const StudyTimerContext = createContext();

export function StudyTimerProvider({ children }) {
    const [mode, setMode] = useState("pomodoro");
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [activeSubject, setActiveSubject] = useState("General Study");
    const [stopwatchElapsed, setStopwatchElapsed] = useState(0);
    const [completedSessionsCount, setCompletedSessionsCount] = useState(0);

    const timerRef = useRef(null);

    // Continuous tick effect
    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                if (mode === "stopwatch") {
                    setStopwatchElapsed((prev) => prev + 1);
                } else {
                    setTimeLeft((prev) => {
                        if (prev <= 1) {
                            clearInterval(timerRef.current);
                            setIsRunning(false);
                            onTimerComplete();
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }

        return () => clearInterval(timerRef.current);
    }, [isRunning, mode]);

    async function onTimerComplete() {
        setCompletedSessionsCount((c) => c + 1);
        const durationMins = Math.max(1, Math.round((MODE_PRESETS[mode] || 1500) / 60));
        try {
            await saveStudySession({
                subject: activeSubject,
                durationMinutes: durationMins,
                mode: mode,
                notes: "Completed focus session"
            });
        } catch (err) {
            console.error("Failed to auto-save completed session", err);
        }
    }

    function startTimer() {
        setIsRunning(true);
    }

    function pauseTimer() {
        setIsRunning(false);
    }

    function toggleTimer() {
        setIsRunning((prev) => !prev);
    }

    function resetTimer(newMode = mode) {
        setIsRunning(false);
        setMode(newMode);
        if (newMode === "stopwatch") {
            setStopwatchElapsed(0);
        } else {
            setTimeLeft(MODE_PRESETS[newMode] || 1500);
        }
    }

    function switchMode(newMode) {
        resetTimer(newMode);
    }

    return (
        <StudyTimerContext.Provider
            value={{
                mode,
                timeLeft,
                stopwatchElapsed,
                isRunning,
                activeSubject,
                completedSessionsCount,
                setActiveSubject,
                startTimer,
                pauseTimer,
                toggleTimer,
                resetTimer,
                switchMode
            }}
        >
            {children}
        </StudyTimerContext.Provider>
    );
}

export function useStudyTimer() {
    return useContext(StudyTimerContext);
}
