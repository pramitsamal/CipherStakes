import React from 'react';
import { motion } from 'framer-motion';

/**
 * 7-day streak bar.
 * - "current" of 0 with misses=0 after reset means fresh start; show 0/7.
 * - Highlights filled segments gold; current day violet; future muted.
 */
const StreakBar = ({ current = 0, missesInWindow = 0 }) => {
    const total = 7;
    const filled = Math.min(current, total);
    const showMissIndicator = missesInWindow > 0;

    return (
        <div data-testid="streak-bar" className="w-full">
            <div className="flex items-center gap-2">
                {Array.from({ length: total }, (_, i) => {
                    const isFilled = i < filled;
                    const isCurrent = i === filled && current < total;
                    return (
                        <motion.div
                            key={i}
                            initial={{ scaleY: 0.6, opacity: 0 }}
                            animate={{ scaleY: 1, opacity: 1 }}
                            transition={{ delay: i * 0.04, duration: 0.24 }}
                            className="h-2 flex-1 rounded-full"
                            style={{
                                backgroundColor: isFilled
                                    ? 'var(--cs-gold)'
                                    : 'rgba(255,255,255,0.08)',
                                boxShadow: isCurrent
                                    ? '0 0 0 1px rgba(108,63,197,0.6), 0 0 10px rgba(108,63,197,0.28)'
                                    : 'none',
                            }}
                        />
                    );
                })}
            </div>
            <div
                className="mt-2 flex items-center justify-between text-xs"
                style={{ color: 'var(--cs-text-muted)' }}
            >
                <span data-testid="streak-bar-count">{filled}/7 day streak</span>
                {showMissIndicator && (
                    <span data-testid="streak-bar-protection" className="text-[color:var(--cs-gold)]">
                        Streak protection used (1 miss allowed)
                    </span>
                )}
            </div>
        </div>
    );
};

export default StreakBar;
