import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Gift, Copy, Flame, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import StreakBar from '@/components/common/StreakBar';
import AscensionCard from '@/components/common/AscensionCard';

const format = (n) => Number(n || 0).toLocaleString();

const DashboardPage = () => {
    const { user, refreshUser } = useAuth();
    const [entries, setEntries] = useState([]);
    const [claimStatus, setClaimStatus] = useState(null);
    const [referrals, setReferrals] = useState(null);
    const [ascension, setAscension] = useState(null);
    const [claiming, setClaiming] = useState(false);

    const loadAll = useCallback(async () => {
        const [e, c, r, a] = await Promise.all([
            api.get('/users/me/entries?limit=10'),
            api.get('/claims/status'),
            api.get('/users/me/referrals'),
            api.get('/users/me/ascension'),
        ]);
        setEntries(e.data || []);
        setClaimStatus(c.data);
        setReferrals(r.data);
        setAscension(a.data);
    }, []);

    useEffect(() => {
        loadAll().catch(() => {});
    }, [loadAll]);

    const handleClaim = async () => {
        setClaiming(true);
        try {
            const res = await api.post('/claims/daily');
            const data = res.data;
            if (data.credited) {
                toast.success(data.message);
            } else {
                toast.message('Already claimed today. Come back tomorrow.');
            }
            await Promise.all([refreshUser(), loadAll()]);
        } catch (_err) {
            toast.error('Claim failed');
        } finally {
            setClaiming(false);
        }
    };

    const copyReferral = async () => {
        if (!user?.referral_code) return;
        const link = `${window.location.origin}/register?ref=${user.referral_code}`;
        try {
            await navigator.clipboard.writeText(link);
            toast.success('Referral link copied');
        } catch (_e) {
            toast.error('Copy failed');
        }
    };

    const streak = claimStatus?.streak || user?.streak || {
        current: 0,
        misses_in_window: 0,
    };

    const claimedToday = claimStatus?.claimed_today;

    return (
        <div data-testid="dashboard-page" className="cs-grid-bg">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-8">
                    <div>
                        <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--cs-text-muted)' }}>
                            Welcome back
                        </div>
                        <h1 className="cs-display text-3xl mt-1" style={{ color: 'var(--cs-text)' }}>
                            {user?.email?.split('@')[0] || 'Player'}
                        </h1>
                    </div>
                    {!user?.email_verified && (
                        <Badge
                            className="border w-fit"
                            style={{
                                borderColor: 'rgba(201,168,76,0.35)',
                                backgroundColor: 'rgba(201,168,76,0.06)',
                                color: 'var(--cs-gold)',
                            }}
                            data-testid="dashboard-email-verify-badge"
                        >
                            Verify email for +100 Coins
                        </Badge>
                    )}
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    {/* Balance */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        data-testid="dashboard-balance-card"
                        className="lg:col-span-2 rounded-2xl border p-6"
                        style={{
                            backgroundColor: 'var(--cs-surface)',
                            borderColor: 'var(--cs-border)',
                            boxShadow: 'var(--cs-shadow)',
                        }}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--cs-text-muted)' }}>
                                    Cipher Coin balance
                                </div>
                                <div
                                    className="cs-display text-5xl sm:text-6xl mt-2"
                                    style={{ color: 'var(--cs-gold)' }}
                                    data-testid="dashboard-coin-balance"
                                >
                                    <span data-testid="dashboard-coin-balance-value">
                                        {format(user?.coin_balance)}
                                    </span>
                                </div>
                                <div
                                    className="mt-2 text-xs"
                                    style={{ color: 'var(--cs-text-muted)' }}
                                >
                                    Lifetime Cipher Gold purchased: ${Number(user?.gold_purchased_usd || 0).toFixed(2)}
                                </div>
                            </div>
                            <Coins size={40} style={{ color: 'var(--cs-gold)' }} />
                        </div>

                        <div className="mt-6">
                            <StreakBar current={streak.current} missesInWindow={streak.misses_in_window} />
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <Button
                                onClick={handleClaim}
                                disabled={claimedToday || claiming}
                                data-testid="daily-claim-button"
                                className="h-11 gap-2 font-medium"
                                style={{
                                    backgroundColor: claimedToday ? 'rgba(255,255,255,0.06)' : 'var(--cs-gold)',
                                    color: claimedToday ? 'var(--cs-text-muted)' : 'var(--cs-bg)',
                                }}
                            >
                                <Flame size={16} />
                                {claimedToday ? 'Claimed today' : claiming ? 'Claiming…' : 'Claim 50 Coins'}
                            </Button>
                            <Link to="/draws">
                                <Button
                                    variant="ghost"
                                    className="h-11 border"
                                    style={{
                                        borderColor: 'var(--cs-border)',
                                        color: 'var(--cs-text)',
                                    }}
                                    data-testid="dashboard-cta-draws"
                                >
                                    Enter a draw <ArrowRight size={14} className="ml-1" />
                                </Button>
                            </Link>
                            <Link to="/store">
                                <Button
                                    variant="ghost"
                                    className="h-11 border"
                                    style={{
                                        borderColor: 'var(--cs-border)',
                                        color: 'var(--cs-text)',
                                    }}
                                    data-testid="dashboard-cta-store"
                                >
                                    Buy a pack
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Referral */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.06 }}
                        data-testid="dashboard-referral-card"
                        className="rounded-2xl border p-6"
                        style={{
                            backgroundColor: 'var(--cs-surface)',
                            borderColor: 'var(--cs-border)',
                        }}
                    >
                        <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--cs-text-muted)' }}>
                            Your referral
                        </div>
                        <div
                            className="cs-display text-3xl mt-2"
                            style={{ color: 'var(--cs-gold)' }}
                            data-testid="dashboard-referral-code"
                        >
                            {user?.referral_code}
                        </div>
                        <div
                            className="mt-3 text-xs"
                            style={{ color: 'var(--cs-text-muted)' }}
                        >
                            Earn 200 Cipher Coins every time a friend signs up with your code.
                        </div>
                        <Button
                            onClick={copyReferral}
                            className="mt-4 w-full h-11 gap-2 border"
                            variant="ghost"
                            style={{
                                borderColor: 'var(--cs-border)',
                                color: 'var(--cs-text)',
                            }}
                            data-testid="referral-copy-button"
                        >
                            <Copy size={14} /> Copy referral link
                        </Button>
                        <div
                            className="mt-5 grid grid-cols-2 gap-3 text-xs"
                            style={{ color: 'var(--cs-text-muted)' }}
                        >
                            <StatMini label="Friends referred" value={referrals?.total_referrals ?? 0} testid="referral-stat-count" />
                            <StatMini label="Coins earned" value={referrals?.total_coins_earned ?? 0} testid="referral-stat-coins" />
                        </div>
                    </motion.div>
                </div>

                {/* Ascension progression (read-only, surfaces 30-day T1 bonus) */}
                <div className="mt-6">
                    <AscensionCard data={ascension} />
                </div>

                {/* Entries */}
                <div className="mt-10">
                    <div className="flex items-end justify-between mb-4">
                        <h2 className="cs-display text-2xl" style={{ color: 'var(--cs-text)' }}>
                            Your latest entries
                        </h2>
                        <Link
                            to="/results"
                            className="text-xs"
                            style={{ color: 'var(--cs-gold)' }}
                            data-testid="dashboard-view-results-link"
                        >
                            Results feed →
                        </Link>
                    </div>
                    {entries.length === 0 ? (
                        <div
                            className="rounded-2xl border p-10 text-center"
                            style={{
                                backgroundColor: 'var(--cs-surface)',
                                borderColor: 'var(--cs-border)',
                            }}
                            data-testid="dashboard-entries-empty"
                        >
                            <Gift size={32} className="mx-auto" style={{ color: 'var(--cs-gold)' }} />
                            <p className="mt-3" style={{ color: 'var(--cs-text-muted)' }}>
                                You haven’t entered a draw yet.
                            </p>
                            <Link to="/draws">
                                <Button
                                    className="mt-4"
                                    style={{
                                        backgroundColor: 'var(--cs-gold)',
                                        color: 'var(--cs-bg)',
                                    }}
                                    data-testid="dashboard-entries-empty-cta"
                                >
                                    View active draws
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div
                            className="rounded-2xl border overflow-hidden"
                            style={{
                                backgroundColor: 'var(--cs-surface)',
                                borderColor: 'var(--cs-border)',
                            }}
                            data-testid="dashboard-entries-list"
                        >
                            {entries.map((e) => (
                                <div
                                    key={e.entry_id}
                                    className="px-5 py-4 flex flex-wrap items-center gap-3 border-b last:border-b-0"
                                    style={{ borderColor: 'var(--cs-border)' }}
                                >
                                    <Badge
                                        className="border"
                                        style={{
                                            borderColor: 'rgba(201,168,76,0.3)',
                                            backgroundColor: 'rgba(201,168,76,0.05)',
                                            color: 'var(--cs-gold)',
                                        }}
                                    >
                                        {e.draw_id}
                                    </Badge>
                                    <span
                                        className="cs-mono text-xs"
                                        style={{ color: 'var(--cs-text-muted)' }}
                                    >
                                        {e.entry_id.slice(0, 8)}…{e.entry_id.slice(-4)}
                                    </span>
                                    <span
                                        className="text-xs ml-auto"
                                        style={{ color: 'var(--cs-text-muted)' }}
                                    >
                                        {new Date(e.timestamp).toUTCString()}
                                    </span>
                                    <Badge
                                        className="border"
                                        style={{
                                            borderColor: 'var(--cs-border)',
                                            color:
                                                e.status === 'active'
                                                    ? 'var(--cs-success)'
                                                    : 'var(--cs-text-muted)',
                                        }}
                                    >
                                        {e.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatMini = ({ label, value, testid }) => (
    <div
        className="rounded-lg border p-3"
        style={{
            borderColor: 'var(--cs-border)',
            backgroundColor: 'var(--cs-surface-2)',
        }}
        data-testid={testid}
    >
        <div
            className="text-[10px] uppercase tracking-widest"
            style={{ color: 'var(--cs-text-muted)' }}
        >
            {label}
        </div>
        <div className="cs-display text-xl mt-1" style={{ color: 'var(--cs-gold)' }}>
            {Number(value).toLocaleString()}
        </div>
    </div>
);

export default DashboardPage;
