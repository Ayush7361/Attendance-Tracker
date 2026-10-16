import MobileNotificationDrawer from "./MobileNotificationDrawer";

function StudentPageHeader({ title, subtitle, notifications, extra }) {
    return (
        <div className="student-page-head">
            <div>
                <h1 className="page-title">{title}</h1>
                {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
            </div>
            <div className="student-page-head-actions">
                {extra}
                <MobileNotificationDrawer {...(notifications || {})} />
            </div>
        </div>
    );
}

export default StudentPageHeader;
