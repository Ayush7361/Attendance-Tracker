function ResetSection({ onResetMonth, onResetAll }) {
    return (
        <div className="reset-section">
            <button className="reset-btn" onClick={onResetMonth}>Clear This Month</button>
            <button className="reset-btn danger" onClick={onResetAll}>Reset Everything</button>
        </div>
    );
}

export default ResetSection;