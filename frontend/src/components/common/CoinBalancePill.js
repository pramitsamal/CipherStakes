import React from 'react';
import { Link } from 'react-router-dom';
import { Coins } from 'lucide-react';

const format = (n) => {
    if (n === undefined || n === null) return '0';
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const CoinBalancePill = ({ balance = 0, className = '' }) => {
    return (
        <Link
            to="/dashboard"
            data-testid="header-coin-balance-pill"
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors ${className}`}
            style={{
                borderColor: 'var(--cs-border)',
                backgroundColor: 'rgba(16,16,30,0.9)',
            }}
        >
            <Coins size={14} style={{ color: 'var(--cs-gold)' }} />
            <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: 'var(--cs-text)' }}
                data-testid="header-coin-balance-value"
            >
                {format(balance)}
            </span>
            <span
                className="text-xs hidden sm:inline"
                style={{ color: 'var(--cs-text-muted)' }}
            >
                Coins
            </span>
        </Link>
    );
};

export default CoinBalancePill;
