import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
    initServiceWorker,
    getNotificationPermission,
    requestMobileNotificationPermission,
    generateAcademicAlerts,
    saveDismissedNotifId
} from "../utils/mobileNotificationService";
import { getUserNotifications, markAllNotificationsRead } from "../api/notificationApi";
import "../styles/MobileNotificationDrawer.css";

function MobileNotificationDrawer({ schedule, todayLogged, deadlines = [], events = [] }) {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState("default");
    const [alerts, setAlerts] = useState([]);
    const [serverNotifs, setServerNotifs] = useState([]);

    useEffect(() => {
        initServiceWorker();
        setPermissionStatus(getNotificationPermission());
    }, []);

    useEffect(() => {
        const generated = generateAcademicAlerts({ schedule, todayLogged, deadlines, events });
        setAlerts(generated);
        loadServerNotifications();
    }, [schedule, todayLogged, deadlines, events, isOpen]);

    async function loadServerNotifications() {
        try {
            const data = await getUserNotifications();
            if (data && data.notifications) {
                setServerNotifs(data.notifications);
            }
        } catch (err) {
            console.error("Failed to load server notifications", err);
        }
    }

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

    async function handleClearAll() {
        alerts.forEach((a) => saveDismissedNotifId(a.id));
        setAlerts([]);
        try {
            await markAllNotificationsRead();
            setServerNotifs([]);
        } catch (err) {
            console.error("Failed to mark all read", err);
        }
    }

    function handleNavigate(url) {
        setIsOpen(false);
        if (url) navigate(url);
    }

    const totalUnreadCount = alerts.length + serverNotifs.filter(n => !n.isRead).length;

    return (
        <div className="mobile-notif-wrapper">
            <button
                type="button"
                className={`mobile-bell-btn ${totalUnreadCount > 0 ? "has-unread" : ""}`}
                onClick={() => setIsOpen(true)}
                title="Academic Alerts & Notifications"
            >
                <svg className="bell-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
                </svg>
                <span className="bell-btn-text">Alerts</span>
                {totalUnreadCount > 0 && <span className="bell-badge">{totalUnreadCount}</span>}
            </button>

            {isOpen && createPortal(
                <div className="mobile-drawer-overlay" onClick={() => setIsOpen(false)}>
                    <div className="mobile-drawer-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="drawer-header">
                            <div>
                                <h3 className="drawer-title">Academic Notifications</h3>
                                <p className="drawer-subtitle">
                                    {totalUnreadCount} active {totalUnreadCount === 1 ? "alert" : "alerts"}
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

                        <div className="drawer-alerts-list">
                            {/* Server teacher notifications */}
                            {serverNotifs.length > 0 && (
                                <div style={{ marginBottom: "12px" }}>
                                    <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#818cf8", marginBottom: "6px", textTransform: "uppercase" }}>
                                        👨‍🏫 Teacher Log Notifications
                                    </div>
                                    {serverNotifs.map((sn) => (
                                        <div
                                            key={sn._id}
                                            className={`drawer-alert-item ${sn.type === "ATTENDANCE_WARNING" ? "urgent-item" : ""}`}
                                            style={{ marginBottom: "8px" }}
                                        >
                                            <span className={`alert-type-pill ${sn.type === "ATTENDANCE_WARNING" ? "pill-urgent" : "pill-info"}`}>
                                                {sn.type === "ATTENDANCE_WARNING" ? "WARNING" : "TEACHER LOG"}
                                            </span>
                                            <div className="alert-item-body">
                                                <h5 className="alert-item-title">{sn.title}</h5>
                                                <p className="alert-item-msg">{sn.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Standard generated system alerts */}
                            {alerts.length === 0 && serverNotifs.length === 0 ? (
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

                        {(alerts.length > 0 || serverNotifs.length > 0) && (
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
                </div>,
                document.body
            )}
        </div>
    );
}

export default MobileNotificationDrawer;
