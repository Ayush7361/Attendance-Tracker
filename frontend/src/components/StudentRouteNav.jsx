import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "../styles/StudentRouteNav.css";

const routes = [
    { to: "/", label: "Today", end: true },
    { to: "/attendance", label: "Attendance", match: ["/attendance"] },
    { to: "/schedule", label: "Routine", match: ["/schedule", "/routine"] },
    { to: "/deadlines", label: "Tasks", match: ["/deadlines", "/tasks"] },
    { to: "/study", label: "Study", match: ["/study"] },
    { to: "/gpa", label: "GPA", match: ["/gpa"] },
    { to: "/timeline", label: "Calendar", match: ["/timeline", "/calendar"] },
    { to: "/archive", label: "Archive", match: ["/archive"] }
];

function isRouteActive(route, pathname) {
    if (route.end) {
        return pathname === "/";
    }
    if (route.match) {
        return route.match.some((m) => pathname === m || pathname.startsWith(m + "/"));
    }
    return pathname === route.to || pathname.startsWith(route.to + "/");
}

// A visible route switcher for compact layouts. Keeps current page trace centered
// in view and provides easy one-tap switching across all modules.
function StudentRouteNav() {
    const location = useLocation();
    const activeRef = useRef(null);

    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center"
            });
        }
    }, [location.pathname]);

    return (
        <nav className="student-route-nav" aria-label="Student pages">
            {routes.map((route) => {
                const active = isRouteActive(route, location.pathname);

                return (
                    <NavLink
                        key={route.to}
                        to={route.to}
                        ref={active ? activeRef : null}
                        className={`student-route-link${active ? " active" : ""}`}
                    >
                        {route.label}
                    </NavLink>
                );
            })}
        </nav>
    );
}

export default StudentRouteNav;
