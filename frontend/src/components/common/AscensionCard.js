import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * 30-day Ascension Bonus progress card.
 *
 * Premium dark-luxury treatment — gold accent fill on dark surface, no
 * bright primary colors. Mirrors the visual language of StreakBar but
 * shows a 30-step continuous bar instead of 7 segments.
 *
 * Props:
 *   data: { target_entries, current_consecutive, ascension_bonus_claimed,
 *           ascension_bonus_amount, progress_pct }
 */
const AscensionCard = ({ data }) => {
    const target = data?.target_entries ?? 30;
    const current = Math.min(data?.current_consecutive ?? 0, target);
    const claimed = !!data?.ascension_bonus_claimed;
    const amount = data?.ascension_bonus_amount ?? 500;
    const pct = data?.progress_pct ?? Math.round((current * 100) / target);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            data-testid="dashboard-ascension-card"
            className="rounded-2xl border p-6"
            style={{
                backgroundColor: 'var(--cs-surface)',
                borderColor: 'var(--cs-border)',
                boxShadow: 'var(--cs-shadow)',
            }}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div
                        className="text-xs uppercase tracking-widest"
                        style={{ color: 'var(--cs-text-muted)' }}
                    >
                        Ascension bonus
                    </div>
                    <div
                        className="cs-display text-2xl mt-1"
                        style={{ color: 'var(--cs-text)' }}
                    >
                        30-day progression
                    </div>
                </div>
                {claimed ? (
                    <Badge
                        className="border gap-1"
                        style={{
                            borderColor: 'rgba(201,168,76,0.45)',
                            backgroundColor: 'rgba(201,168,76,0.10)',
                            color: 'var(--cs-gold)',
                        }}
                        data-testid="ascension-claimed-badge"
                    >
                        <ShieldCheck size={12} />
                        Claimed
                    </Badge>
                ) : (
                    <Sparkles size={20} style={{ color: 'var(--cs-gold)' }} />
                )}
            </div>

            {/* Progress bar */}
            <div className="mt-5">
                <div
                    className="h-2 w-full rounded-full overflow-hidden"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                    aria-label="Ascension progress"
                    role="progressbar"
                    aria-valuenow={current}
                    aria-valuemin={0}
                    aria-valuemax={target}
                    data-testid="ascension-progress-bar"
                >
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{
                            backgroundColor: 'var(--cs-gold)',
                            boxShadow:
                                '0 0 8px rgba(201,168,76,0.45), inset 0 0 4px rgba(255,255,255,0.18)',
                        }}
                    />
                </div>
                <div
                    className="mt-2 flex items-center justify-between text-xs"
                    style={{ color: 'var(--cs-text-muted)' }}
                >
                    <span data-testid="ascension-progress-count">
                        <span style={{ color: 'var(--cs-gold)', fontWeight: 600 }}>
                            {current}
                        </span>
                        /{target} consecutive T1 entries
                    </span>
                    <span data-testid="ascension-progress-pct">{pct}%</span>
                </div>
            </div>

            <p
                className="mt-4 text-xs leading-relaxed"
                style={{ color: 'var(--cs-text-muted)' }}
                data-testid="ascension-helper-text"
            >
                {claimed ? (
                    <>
                        You unlocked the one-time{' '}
                        <span style={{ color: 'var(--cs-gold)' }}>
                            +{amount.toLocaleString()} Coin
                        </span>{' '}
                        Ascension Bonus. Your reward has been credited to your
                        balance.
                    </>
                ) : (
                    <>
                        Enter the T1 Daily Flash on{' '}
                        <span style={{ color: 'var(--cs-text)' }}>30 consecutive days</span>{' '}
                        to unlock a one-time{' '}
                        <span style={{ color: 'var(--cs-gold)' }}>
                            +{amount.toLocaleString()} Coin
                        </span>{' '}
                        Ascension Bonus.
                    </>
                )}
            </p>
        </motion.div>
    );
};

export default AscensionCard;
