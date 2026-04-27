import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * CountdownTimer
 * @param {string} targetTime  ISO 8601 UTC timestamp for the next draw.
 * @param {"card"|"hero"}   size  Visual size preset (default "card").
 */
const pad2 = (n) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

const parseTarget = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
};

const computeParts = (target) => {
    if (!target) return { d: 0, h: 0, m: 0, s: 0, total: 0 };
    const total = target.getTime() - Date.now();
    if (total <= 0) return { d: 0, h: 0, m: 0, s: 0, total: 0 };
    const d = Math.floor(total / 86400000);
    const h = Math.floor((total % 86400000) / 3600000);
    const m = Math.floor((total % 3600000) / 60000);
    const s = Math.floor((total % 60000) / 1000);
    return { d, h, m, s, total };
};

const CountdownTimer = ({ targetTime, size = 'card' }) => {
    const target = parseTarget(targetTime);
    const [parts, setParts] = useState(() => computeParts(target));

    useEffect(() => {
        if (!target) return undefined;
        // Update immediately when the target changes
        setParts(computeParts(target));
        const id = setInterval(() => {
            setParts(computeParts(target));
        }, 1000);
        return () => clearInterval(id);
    }, [targetTime]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!target) {
        return (
            <div
                className="text-xs"
                style={{ color: 'var(--cs-text-muted)' }}
                data-testid="countdown-timer-empty"
            >
                —
            </div>
        );
    }

    const isLive = parts.total <= 0;

    const isHero = size === 'hero';
    const numberCls = isHero
        ? 'cs-display text-3xl sm:text-5xl'
        : 'cs-display text-xl sm:text-2xl';
    const boxPad = isHero ? 'px-3 py-2 sm:px-4 sm:py-3' : 'px-2 py-1.5';
    const labelCls = isHero
        ? 'text-[10px] sm:text-xs uppercase tracking-widest'
        : 'text-[9px] uppercase tracking-widest';
    const gapCls = isHero ? 'gap-2 sm:gap-3' : 'gap-1.5';

    if (isLive) {
        return (
            <div
                data-testid="countdown-timer-live"
                className={`inline-flex items-center ${gapCls} rounded-lg border ${boxPad}`}
                style={{
                    backgroundColor: 'var(--cs-surface-2)',
                    borderColor: 'rgba(201,168,76,0.45)',
                    color: 'var(--cs-gold)',
                    boxShadow: '0 0 0 1px rgba(201,168,76,0.18), 0 0 20px rgba(201,168,76,0.18)',
                }}
            >
                <motion.span
                    aria-hidden
                    className="inline-block rounded-full"
                    style={{
                        width: isHero ? 10 : 8,
                        height: isHero ? 10 : 8,
                        backgroundColor: 'var(--cs-gold)',
                    }}
                    animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1.15, 0.9] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span
                    className={`${isHero ? 'cs-display text-xl sm:text-2xl' : 'font-semibold text-sm'} tracking-widest`}
                >
                    DRAW LIVE
                </span>
            </div>
        );
    }

    const units = [
        { value: parts.d, label: 'Days' },
        { value: parts.h, label: 'Hours' },
        { value: parts.m, label: 'Mins' },
        { value: parts.s, label: 'Secs' },
    ];

    return (
        <div
            data-testid="countdown-timer"
            className={`inline-flex items-stretch ${gapCls}`}
        >
            {units.map((u, idx) => (
                <React.Fragment key={u.label}>
                    <div
                        className={`rounded-lg border ${boxPad} text-center min-w-[44px] ${isHero ? 'sm:min-w-[72px]' : ''}`}
                        style={{
                            backgroundColor: 'var(--cs-surface-2)',
                            borderColor: 'rgba(201,168,76,0.18)',
                            boxShadow: isHero
                                ? 'inset 0 0 0 1px rgba(255,255,255,0.03)'
                                : 'none',
                        }}
                        data-testid={`countdown-timer-unit-${u.label.toLowerCase()}`}
                    >
                        <div
                            className={`${numberCls} tabular-nums leading-none`}
                            style={{ color: 'var(--cs-text)' }}
                        >
                            {pad2(u.value)}
                        </div>
                        <div
                            className={`${labelCls} mt-1`}
                            style={{ color: 'var(--cs-text-muted)' }}
                        >
                            {u.label}
                        </div>
                    </div>
                    {idx < units.length - 1 && (
                        <span
                            aria-hidden
                            className={`self-start ${isHero ? 'text-3xl sm:text-5xl mt-1' : 'text-xl mt-0.5'} leading-none`}
                            style={{ color: 'rgba(201,168,76,0.45)' }}
                        >
                            :
                        </span>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default CountdownTimer;
