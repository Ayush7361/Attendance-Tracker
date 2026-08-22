import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useStudyTimer } from "../context/StudyTimerContext";
import "../styles/GlobalMiniTimer.css";

function formatSeconds(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function GlobalMiniTimer() {
    const location = useLocation();
    const { isRunning, timeLeft, stopwatchElapsed, mode, activeSubject, toggleTimer } = useStudyTimer();

    // Hide if on /study page or if timer is not running
    if (location.pathname === "/study" || !isRunning) {
        return null;
    }

    const displayTime = mode === "stopwatch" ? formatSeconds(stopwatchElapsed) : formatSeconds(timeLeft);

    return (
        <div className="global-mini-timer">
            <div className="mini-timer-info">
                <span className="mini-timer-pulse"></span>
                <span className="mini-timer-subject">{activeSubject}</span>
                <span className="mini-timer-clock">{displayTime}</span>
            </div>

            <div className="mini-timer-actions">
                <button type="button" className="mini-timer-btn" onClick={toggleTimer}>
                    {isRunning ? "Pause" : "Start"}
                </button>

                <Link to="/study" className="mini-timer-link">
                    Open Timer →
                </Link>
            </div>
        </div>
    );
}

export default GlobalMiniTimer;
