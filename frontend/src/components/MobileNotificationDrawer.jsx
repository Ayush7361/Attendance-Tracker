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
            {/* Header Bell Button */}
            <button
                type="button"
                className={`mobile-bell-btn ${unreadCount > 0 ? "has-unread" : ""}`}
                onClick={() => setIsOpen(true)}
                title="Notifications"
            >
                <span className="bell-icon">🔔</span>
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
                                <span className="perm-icon">📱</span>
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
                                    <span className="empty-icon">🎉</span>
                                    <p>All caught up! No active alerts right now.</p>
                                </div>
                            ) : (
                                alerts.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`drawer-alert-item ${item.urgent ? "urgent-item" : ""}`}
                                        onClick={() => handleNavigate(item.url)}
                                    >
                                        <span className="alert-item-icon">{item.icon}</span>
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
