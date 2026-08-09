import { useState, useEffect } from 'react';

function ResetSection({ onResetMonth, onResetAll }) {
    const [confirming, setConfirming] = useState(null); // 'month' | 'all' | null

    // auto-cancel the confirm state if the user doesn't tap again in time
    useEffect(() => {
        if (!confirming) return;
        const timer = setTimeout(() => setConfirming(null), 3000);
        return () => clearTimeout(timer);
    }, [confirming]);

    const handleMonthClick = () => {
        if (confirming === 'month') {
            setConfirming(null);
            onResetMonth();
        } else {
            setConfirming('month');
        }
    };

    const handleAllClick = () => {
        if (confirming === 'all') {
            setConfirming(null);
            onResetAll();
        } else {
            setConfirming('all');
        }
    };

    return (
        <div className="reset-section">
            <button
                className={`reset-btn ${confirming === 'month' ? 'confirming' : ''}`}
                onClick={handleMonthClick}
            >
                {confirming === 'month' ? 'Tap again to confirm' : 'Clear This Month'}
            </button>
            <button
                className={`reset-btn danger ${confirming === 'all' ? 'confirming' : ''}`}
                onClick={handleAllClick}
            >
                {confirming === 'all' ? 'Tap again to confirm' : 'Reset Everything'}
            </button>
        </div>
    );
}

export default ResetSection;