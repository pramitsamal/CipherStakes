import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, Clock, Truck, Wallet, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const formatCurrency = (n, fractionDigits = 0) =>
    Number(n || 0).toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: fractionDigits,
    });

const DrawCard = ({ draw, featured = false }) => {
    const isJackpot = draw.prize_type === 'usdc_jackpot_rolling';
    const isPhysical = draw.prize_type === 'physical';
    const isUpcoming = draw.status === 'upcoming';
    const isActive = draw.status === 'active';

    let prize = null;
    if (isJackpot) prize = draw.jackpot_usdc;
    else if (isPhysical) prize = draw.prize_value_usd;
    else prize = draw.prize_fixed_usdc;

    const cadence =
        draw.draw_id === 'T1_DAILY_FLASH'
            ? 'Draws daily 20:00 UTC'
            : draw.draw_id === 'T2_WEEKLY_STAKES'
              ? 'Draws every Sunday 20:00 UTC'
              : draw.draw_id === 'T3_BIWEEKLY_RIDE'
                ? 'Alt. Mondays 20:00 UTC'
                : 'Coming soon';

    const prizeLabelText = isJackpot
        ? 'USDC Jackpot (rolling)'
        : isPhysical
          ? 'Prize value'
          : isUpcoming
            ? 'Prize'
            : 'USDC';

    const ctaLabel = isUpcoming
        ? 'Notify me at launch'
        : isJackpot
          ? 'Enter Daily Flash'
          : isPhysical
            ? 'Enter Draw'
            : 'Enter draw';

    const ctaBg = isJackpot
        ? 'var(--cs-gold)'
        : isPhysical
          ? 'var(--cs-gold)'
          : 'var(--cs-violet)';
    const ctaColor = isJackpot || isPhysical ? 'var(--cs-bg)' : 'var(--cs-text)';

    return (
        <motion.div
            initial={{ y: 8, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
            data-testid={`draw-card-${draw.draw_id}`}
            className={`group relative overflow-hidden rounded-2xl border transition-colors duration-200 ${
                featured
                    ? 'border-[rgba(201,168,76,0.35)]'
                    : 'border-[color:var(--cs-border)]'
            } hover:border-[rgba(201,168,76,0.35)] hover:shadow-[var(--cs-glow-gold)]`}
            style={{
                backgroundColor: 'var(--cs-surface)',
                boxShadow: featured
                    ? '0 18px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,168,76,0.12)'
                    : 'var(--cs-shadow)',
            }}
        >
            <div className="relative aspect-[16/9] overflow-hidden">
                <img
                    src={draw.image_url}
                    alt={draw.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.82) 100%)',
                    }}
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    <Badge
                        className="border"
                        style={{
                            backgroundColor: 'rgba(10,10,15,0.7)',
                            borderColor: 'rgba(201,168,76,0.35)',
                            color: 'var(--cs-gold)',
                        }}
                        data-testid={`draw-card-tier-${draw.draw_id}`}
                    >
                        {draw.tier}
                    </Badge>
                    {isPhysical && isActive && (
                        <Badge
                            className="border font-semibold tracking-wider"
                            style={{
                                backgroundColor: 'rgba(10,10,15,0.78)',
                                borderColor: 'rgba(201,168,76,0.5)',
                                color: 'var(--cs-gold)',
                            }}
                            data-testid={`draw-card-physical-badge-${draw.draw_id}`}
                        >
                            PHYSICAL PRIZE
                        </Badge>
                    )}
                    {isUpcoming && (
                        <Badge
                            className="border"
                            style={{
                                backgroundColor: 'rgba(10,10,15,0.7)',
                                borderColor: 'rgba(255,255,255,0.16)',
                                color: 'var(--cs-text-muted)',
                            }}
                        >
                            Coming soon
                        </Badge>
                    )}
                </div>
            </div>
            <div className="p-5">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--cs-text)' }}>
                    {draw.title}
                </h3>
                <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--cs-text-muted)' }}
                >
                    {draw.subtitle}
                </p>
                <div className="mt-4 flex items-baseline gap-2">
                    <div
                        className="cs-display text-3xl sm:text-4xl"
                        style={{ color: 'var(--cs-gold)' }}
                        data-testid={`draw-card-jackpot-${draw.draw_id}`}
                    >
                        {prize != null ? formatCurrency(prize) : '—'}
                    </div>
                    <span
                        className="text-[11px] uppercase tracking-widest"
                        style={{ color: 'var(--cs-text-muted)' }}
                    >
                        {prizeLabelText}
                    </span>
                </div>
                <div
                    className="mt-4 flex items-center justify-between text-xs"
                    style={{ color: 'var(--cs-text-muted)' }}
                >
                    <span className="inline-flex items-center gap-1">
                        <Coins size={12} style={{ color: 'var(--cs-gold)' }} /> {draw.entry_cost_coins} Coins / entry
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {cadence}
                    </span>
                </div>
                <div className="mt-5">
                    {isUpcoming ? (
                        <Button
                            disabled
                            className="w-full h-11 rounded-xl"
                            variant="secondary"
                            data-testid={`draw-card-cta-${draw.draw_id}`}
                        >
                            {ctaLabel}
                        </Button>
                    ) : (
                        <Link to={`/draws/${draw.draw_id}`}>
                            <Button
                                className="w-full h-11 rounded-xl font-medium"
                                style={{
                                    backgroundColor: ctaBg,
                                    color: ctaColor,
                                }}
                                data-testid={`draw-card-cta-${draw.draw_id}`}
                            >
                                {ctaLabel}
                            </Button>
                        </Link>
                    )}
                </div>
                {isPhysical && isActive && (
                    <div
                        className="mt-3 flex items-center gap-2 text-[11px]"
                        style={{ color: 'var(--cs-text-muted)' }}
                        data-testid={`draw-card-winner-chooses-${draw.draw_id}`}
                    >
                        <span className="uppercase tracking-widest" style={{ color: 'var(--cs-gold)' }}>
                            Winner chooses
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Truck size={11} /> Delivery
                        </span>
                        <span style={{ color: 'var(--cs-border-strong, rgba(255,255,255,0.18))' }}>·</span>
                        <span className="inline-flex items-center gap-1">
                            <Wallet size={11} /> Liquidate
                        </span>
                        <span style={{ color: 'var(--cs-border-strong, rgba(255,255,255,0.18))' }}>·</span>
                        <span className="inline-flex items-center gap-1">
                            <TrendingUp size={11} /> Earn $1.5–1.75k/mo
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default DrawCard;
