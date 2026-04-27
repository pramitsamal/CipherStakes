import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, Wallet, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import JackpotCounter from '@/components/common/JackpotCounter';
import DrawCard from '@/components/common/DrawCard';
import Wordmark from '@/components/common/Wordmark';

const LandingPage = () => {
    const [draws, setDraws] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await api.get('/draws');
                if (mounted) setDraws(res.data || []);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const activeDraws = draws.filter((d) => d.status === 'active');
    const upcomingDraws = draws.filter((d) => d.status === 'upcoming');

    return (
        <div data-testid="landing-page" className="cs-grid-bg">
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
                    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
                        <div>
                            <Badge
                                className="border uppercase tracking-widest text-[10px]"
                                style={{
                                    borderColor: 'rgba(201,168,76,0.35)',
                                    backgroundColor: 'rgba(201,168,76,0.06)',
                                    color: 'var(--cs-gold)',
                                }}
                                data-testid="landing-badge"
                            >
                                Provably fair sweepstakes
                            </Badge>
                            <motion.h1
                                initial={{ y: 12, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="cs-display mt-4 text-4xl sm:text-5xl lg:text-6xl leading-[1.05]"
                                style={{ color: 'var(--cs-text)' }}
                                data-testid="landing-hero-heading"
                            >
                                Luxury prize draws,
                                <br />
                                <span style={{ color: 'var(--cs-gold)' }}>provably fair.</span>
                            </motion.h1>
                            <p
                                className="mt-5 max-w-xl text-base sm:text-lg"
                                style={{ color: 'var(--cs-text-muted)' }}
                                data-testid="landing-hero-subtext"
                            >
                                Earn or purchase Cipher Coins. Burn them to enter rolling USDC jackpots
                                and weekly luxury prize draws. Every entry gets a signed receipt;
                                every winner is picked with cryptographically secure RNG.
                            </p>
                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link to="/draws">
                                    <Button
                                        size="lg"
                                        className="h-12 px-5 gap-2 font-medium"
                                        style={{
                                            backgroundColor: 'var(--cs-gold)',
                                            color: 'var(--cs-bg)',
                                        }}
                                        data-testid="landing-hero-cta-draws"
                                    >
                                        View active draws <ArrowRight size={16} />
                                    </Button>
                                </Link>
                                <Link to="/how-it-works">
                                    <Button
                                        size="lg"
                                        variant="ghost"
                                        className="h-12 border"
                                        style={{
                                            borderColor: 'var(--cs-border)',
                                            color: 'var(--cs-text)',
                                        }}
                                        data-testid="landing-hero-cta-how"
                                    >
                                        How it works
                                    </Button>
                                </Link>
                            </div>
                            <div
                                className="mt-7 flex flex-wrap gap-2 text-xs"
                                style={{ color: 'var(--cs-text-muted)' }}
                            >
                                {[
                                    'Legally structured sweepstakes',
                                    'UUID + sha256 entry receipts',
                                    'KYC only for winners',
                                ].map((t) => (
                                    <span
                                        key={t}
                                        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1"
                                        style={{ borderColor: 'var(--cs-border)' }}
                                    >
                                        <ShieldCheck size={12} style={{ color: 'var(--cs-gold)' }} />
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Jackpot hero card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.45 }}
                            className="relative rounded-2xl overflow-hidden border"
                            style={{
                                borderColor: 'rgba(201,168,76,0.28)',
                                backgroundColor: 'var(--cs-surface)',
                                boxShadow: '0 40px 120px rgba(0,0,0,0.55)',
                            }}
                            data-testid="landing-hero-jackpot-card"
                        >
                            <div
                                className="absolute inset-0 opacity-40"
                                style={{
                                    backgroundImage:
                                        'radial-gradient(circle at 18% 20%, rgba(108,63,197,0.3), transparent 45%), radial-gradient(circle at 82% 80%, rgba(201,168,76,0.2), transparent 45%)',
                                }}
                            />
                            <div className="relative p-8 sm:p-10">
                                <div
                                    className="text-xs uppercase tracking-[0.3em]"
                                    style={{ color: 'var(--cs-text-muted)' }}
                                >
                                    T1 · Daily Flash jackpot
                                </div>
                                <div className="mt-3">
                                    <JackpotCounter drawId="T1_DAILY_FLASH" />
                                </div>
                                <div
                                    className="mt-2 text-xs"
                                    style={{ color: 'var(--cs-text-muted)' }}
                                >
                                    Rolling USDC — grows until won. Updates every 30s.
                                </div>
                                <Separator className="my-6" style={{ backgroundColor: 'var(--cs-border)' }} />
                                <div className="grid grid-cols-3 gap-4">
                                    <Stat
                                        label="Entry cost"
                                        value="50 Coins"
                                        testid="landing-stat-entry-cost"
                                    />
                                    <Stat label="Next draw" value="20:00 UTC" testid="landing-stat-next-draw" />
                                    <Stat label="Method" value="CSPRNG" testid="landing-stat-method" />
                                </div>
                                <Link to="/draws/T1_DAILY_FLASH" className="block mt-6">
                                    <Button
                                        className="w-full h-12 rounded-xl gap-2 font-medium"
                                        style={{
                                            backgroundColor: 'var(--cs-gold)',
                                            color: 'var(--cs-bg)',
                                        }}
                                        data-testid="landing-hero-cta-enter-t1"
                                    >
                                        Enter Daily Flash <ArrowRight size={16} />
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Active Draws */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <h2
                            className="cs-display text-3xl"
                            style={{ color: 'var(--cs-text)' }}
                        >
                            Active draws
                        </h2>
                        <p
                            className="mt-1 text-sm"
                            style={{ color: 'var(--cs-text-muted)' }}
                        >
                            One entry, one receipt, one winner per cycle.
                        </p>
                    </div>
                    <Link
                        to="/draws"
                        className="text-sm inline-flex items-center gap-1"
                        style={{ color: 'var(--cs-gold)' }}
                        data-testid="landing-view-all-draws"
                    >
                        View all <ArrowRight size={12} />
                    </Link>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {loading
                        ? Array.from({ length: 3 }).map((_, i) => (
                              <div
                                  key={i}
                                  className="rounded-2xl aspect-[3/4] border animate-pulse"
                                  style={{
                                      backgroundColor: 'var(--cs-surface)',
                                      borderColor: 'var(--cs-border)',
                                  }}
                              />
                          ))
                        : activeDraws.map((d) => (
                              <DrawCard key={d.draw_id} draw={d} featured={d.tier === 'T1'} />
                          ))}
                    {!loading && upcomingDraws.slice(0, 1).map((d) => (
                        <DrawCard key={d.draw_id} draw={d} />
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section
                className="border-t"
                style={{ borderColor: 'var(--cs-border)', backgroundColor: 'var(--cs-surface-2)' }}
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center mb-10">
                        <Wordmark size="lg" />
                        <h2
                            className="cs-display text-3xl sm:text-4xl mt-4"
                            style={{ color: 'var(--cs-text)' }}
                        >
                            How CipherStakes works
                        </h2>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-3">
                        <HowStep
                            icon={<Sparkles size={18} />}
                            title="Earn Cipher Coins"
                            body="Claim 50 Coins every day. Build a 7-day streak for a 500-Coin bonus. No purchase required to play."
                            testid="how-step-1"
                        />
                        <HowStep
                            icon={<ShieldCheck size={18} />}
                            title="Burn Coins to enter"
                            body="Each entry is stamped with a UUID and a sha256 receipt hash — verifiable, immutable, yours."
                            testid="how-step-2"
                        />
                        <HowStep
                            icon={<Wallet size={18} />}
                            title="Winners claim USDC or prizes"
                            body="Winning entry is selected with cryptographically secure RNG. Winners complete KYC to receive their prize."
                            testid="how-step-3"
                        />
                    </div>
                    <div
                        className="mt-10 rounded-xl border px-4 py-3 text-xs"
                        style={{
                            borderColor: 'var(--cs-border)',
                            backgroundColor: 'var(--cs-surface)',
                            color: 'var(--cs-text-muted)',
                        }}
                    >
                        Compliance: Cipher Gold purchased with real money has no prize value.
                        Cipher Coins may be earned for free (AMOE) and are used solely to enter draws.
                        Void where prohibited. KYC required before prize release.
                    </div>
                </div>
            </section>
        </div>
    );
};

const Stat = ({ label, value, testid }) => (
    <div data-testid={testid}>
        <div
            className="text-[11px] uppercase tracking-widest"
            style={{ color: 'var(--cs-text-muted)' }}
        >
            {label}
        </div>
        <div className="text-sm font-semibold mt-1" style={{ color: 'var(--cs-text)' }}>
            {value}
        </div>
    </div>
);

const HowStep = ({ icon, title, body, testid }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border p-6"
        style={{
            borderColor: 'var(--cs-border)',
            backgroundColor: 'var(--cs-surface)',
            boxShadow: 'var(--cs-shadow)',
        }}
        data-testid={testid}
    >
        <div
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg"
            style={{
                backgroundColor: 'rgba(201,168,76,0.08)',
                color: 'var(--cs-gold)',
                border: '1px solid rgba(201,168,76,0.25)',
            }}
        >
            {icon}
        </div>
        <div className="mt-4 font-semibold" style={{ color: 'var(--cs-text)' }}>
            {title}
        </div>
        <p className="mt-2 text-sm" style={{ color: 'var(--cs-text-muted)' }}>
            {body}
        </p>
    </motion.div>
);

export default LandingPage;
