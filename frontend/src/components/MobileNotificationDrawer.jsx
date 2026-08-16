import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    initServiceWorker,
    getNotificationPermission,
    requestMobileNotificationPermission,
    generateAcademicAlerts,
    saveDismissedNotifId,
    clearDismissedNotifs
} from "../utils/mobileNotificationService";
import "../styles/MobileNotificationDrawer.css";

function MobileNotificationDrawer({ schedule, todayLogged, deadlines = [], events = [] }) {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState("default");
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        initServiceWorker();
        setPermissionStatus(getNotificationPermission());
    }, []);

    useEffect(() => {
        const generated = generateAcademicAlerts({ schedule, todayLogged, deadlines, events });
        setAlerts(generated);
    }, [schedule, todayLogged, deadlines, events, isOpen]);

    async function handleEnablePush() {
        const granted = await requestMobileNotificationPermission();
        setPermissionStatus(getNotificationPermission());
        if (granted) {
            alert("Native Phone Notifications Enabled! You will receive system alerts on your phone.");
        }
    }

    function handleDismiss(id, e) {
        e.stopPropagation();
        saveDismissedNotifId(id);
        setAlerts((prev) => prev.filter((a) => a.id !== id));
    }

    function handleClearAll() {
        alerts.forEach((a) => saveDismissedNotifId(a.id));
        setAlerts([]);
    }

    function handleNavigate(url) {
        setIsOpen(false);
        navigate(url);
    }

    const unreadCount = alerts.length;

    return (
        <div className="mobile-notif-wrapper">
            {/* Header Bell / Alert Button */}
            <button
                type="button"
                className={`mobile-bell-btn ${unreadCount > 0 ? "has-unread" : ""}`}
                onClick={() => setIsOpen(true)}
                title="Academic Alerts & Notifications"
            >
                <svg className="bell-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
                </svg>
                <span className="bell-btn-text">Alerts</span>
                {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
            </button>

            {/* Slide-Up Phone Sheet Drawer Overlay */}
            {isOpen && (
                <div className="mobile-drawer-overlay" onClick={() => setIsOpen(false)}>
                    <div className="mobile-drawer-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="drawer-handle" />

                        {/* Sheet Header */}
                        <div className="drawer-header">
                            <div>
                                <h3 className="drawer-title">Academic Notifications</h3>
                                <p className="drawer-subtitle">
                                    {unreadCount} active {unreadCount === 1 ? "alert" : "alerts"}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="drawer-close-btn"
                                onClick={() => setIsOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Phone Native Push Permission Banner */}
                        <div className="permission-banner-card">
                            <div className="perm-info">
                                <span className="perm-badge-tag">PUSH</span>
                                <div>
                                    <h4>Phone Push Notifications</h4>
                                    <p>
                                        {permissionStatus === "granted"
                                            ? "✓ Active! System alerts enabled for phone."
                                            : "Get native phone alerts even when screen is locked."}
                                    </p>
                                </div>
                            </div>
                            {permissionStatus !== "granted" && (
                                <button
                                    type="button"
                                    className="perm-enable-btn"
                                    onClick={handleEnablePush}
                                >
                                    Enable Phone Push
                                </button>
                            )}
                        </div>

                        {/* Notification List */}
                        <div className="drawer-alerts-list">
                            {alerts.length === 0 ? (
                                <div className="drawer-empty-box">
                                    <p>All caught up! No active alerts right now.</p>
                                </div>
                            ) : (
                                alerts.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`drawer-alert-item ${item.urgent ? "urgent-item" : ""}`}
                                        onClick={() => handleNavigate(item.url)}
                                    >
                                        <span className={`alert-type-pill ${item.urgent ? "pill-urgent" : "pill-info"}`}>
                                            {item.urgent ? "URGENT" : "NOTICE"}
                                        </span>
                                        <div className="alert-item-body">
                                            <h5 className="alert-item-title">{item.title}</h5>
                                            <p className="alert-item-msg">{item.message}</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="alert-dismiss-btn"
                                            onClick={(e) => handleDismiss(item.id, e)}
                                            title="Dismiss notification"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Drawer Actions */}
                        {alerts.length > 0 && (
                            <div className="drawer-footer-actions">
                                <button
                                    type="button"
                                    className="clear-all-btn"
                                    onClick={handleClearAll}
                                >
                                    Dismiss All Alerts
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MobileNotificationDrawer;
