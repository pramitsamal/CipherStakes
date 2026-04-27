import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Coins, Users, Minus, Plus, ArrowLeft, ShieldCheck, Trophy, Truck, Wallet, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import JackpotCounter from '@/components/common/JackpotCounter';
import CountdownTimer from '@/components/common/CountdownTimer';
import BurnModal from '@/components/common/BurnModal';
import EntryReceipt from '@/components/common/EntryReceipt';

const format = (n) =>
    Number(n || 0).toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    });

const DrawDetailPage = () => {
    const { drawId } = useParams();
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();

    const [draw, setDraw] = useState(null);
    const [stats, setStats] = useState({ total_entries: 0, unique_players: 0 });
    const [quantity, setQuantity] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [burning, setBurning] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const [jackpotAfter, setJackpotAfter] = useState(null);
    const [pendingClaim, setPendingClaim] = useState(null); // unredeemed winning claim on this draw

    const loadDraw = useCallback(async () => {
        try {
            const [d, s] = await Promise.all([
                api.get(`/draws/${drawId}`),
                api.get(`/draws/${drawId}/stats`),
            ]);
            setDraw(d.data);
            setStats(s.data);
        } catch (_err) {
            toast.error('Draw not found');
            navigate('/draws');
        } finally {
            setLoading(false);
        }
    }, [drawId, navigate]);

    // Detect if user has an unredeemed winning entry on this physical draw
    const loadPendingClaim = useCallback(async () => {
        if (!user) {
            setPendingClaim(null);
            return;
        }
        try {
            const res = await api.get('/users/me/wins');
            const wins = res.data || [];
            const winForThisDraw = wins.find(
                (w) => w.draw_id === drawId && w.winning_entry_id && w.winner === user.user_id,
            );
            if (!winForThisDraw) {
                setPendingClaim(null);
                return;
            }
            const status = await api.get(
                `/draws/redeem/status/${winForThisDraw.winning_entry_id}`,
            );
            if (status.data?.redeemed) {
                setPendingClaim(null);
            } else {
                setPendingClaim(winForThisDraw);
            }
        } catch (_e) {
            setPendingClaim(null);
        }
    }, [drawId, user]);

    useEffect(() => {
        loadDraw();
    }, [loadDraw]);

    useEffect(() => {
        loadPendingClaim();
    }, [loadPendingClaim]);

    const openModal = () => {
        if (!user) {
            toast.message('Log in to enter draws');
            navigate(`/login?next=/draws/${drawId}`);
            return;
        }
        setModalOpen(true);
    };

    const confirmBurn = async () => {
        setBurning(true);
        try {
            const res = await api.post('/draws/enter', {
                draw_id: drawId,
                quantity,
            });
            setReceipt(res.data.entries);
            setJackpotAfter(res.data.jackpot_after);
            setModalOpen(false);
            toast.success(`Locked in ${res.data.entries.length} entries`);
            // Surface the 30-day T1 Ascension Bonus as a separate, premium toast
            // when it fires on this entry.
            const bonus = res.data.ascension_bonus;
            if (bonus && bonus.awarded) {
                toast.success(
                    `Ascension unlocked — +${(bonus.coins ?? 500).toLocaleString()} Cipher Coins`,
                    {
                        description:
                            '30 consecutive Daily Flash entries. One-time bonus credited to your balance.',
                        duration: 8000,
                    },
                );
            }
            await Promise.all([refreshUser(), loadDraw()]);
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Failed to lock in entry';
            toast.error(msg);
        } finally {
            setBurning(false);
        }
    };

    if (loading || !draw) {
        return (
            <div
                className="min-h-[60vh] flex items-center justify-center"
                style={{ color: 'var(--cs-text-muted)' }}
            >
                Loading draw…
            </div>
        );
    }

    const isJackpot = draw.prize_type === 'usdc_jackpot_rolling';
    const isUpcoming = draw.status === 'upcoming';
    const cadence =
        draw.draw_id === 'T1_DAILY_FLASH'
            ? 'Draws daily at 20:00 UTC'
            : draw.draw_id === 'T2_WEEKLY_STAKES'
              ? 'Draws every Sunday 20:00 UTC'
              : draw.draw_id === 'T3_BIWEEKLY_RIDE'
                ? 'Alt. Mondays 20:00 UTC'
                : 'Draws on schedule';

    const isPhysical = draw.prize_type === 'physical';

    return (
        <div data-testid="draw-detail-page" className="cs-grid-bg">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                <Link
                    to="/draws"
                    className="inline-flex items-center gap-2 text-sm mb-6"
                    style={{ color: 'var(--cs-text-muted)' }}
                    data-testid="draw-detail-back"
                >
                    <ArrowLeft size={14} /> All draws
                </Link>

                {pendingClaim && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 rounded-2xl border p-5 sm:p-6 cs-sweep-gold relative flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between"
                        style={{
                            backgroundColor: 'var(--cs-surface)',
                            borderColor: 'rgba(201,168,76,0.4)',
                            boxShadow: 'var(--cs-glow-gold)',
                        }}
                        data-testid="draw-detail-winner-banner"
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className="rounded-full p-2"
                                style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}
                            >
                                <Trophy size={22} style={{ color: 'var(--cs-success)' }} />
                            </div>
                            <div>
                                <div
                                    className="text-xs uppercase tracking-widest"
                                    style={{ color: 'var(--cs-success)' }}
                                >
                                    You won this draw
                                </div>
                                <div
                                    className="cs-display text-2xl mt-1"
                                    style={{ color: 'var(--cs-text)' }}
                                >
                                    {draw.prize_label || draw.title}
                                </div>
                                <div
                                    className="mt-1 text-xs"
                                    style={{ color: 'var(--cs-text-muted)' }}
                                >
                                    Choose how to redeem — delivery, liquidate, or fleet yield.
                                </div>
                            </div>
                        </div>
                        <Link to={`/redeem/${pendingClaim.winning_entry_id}`}>
                            <Button
                                className="h-11 gap-2 font-medium"
                                style={{
                                    backgroundColor: 'var(--cs-gold)',
                                    color: 'var(--cs-bg)',
                                }}
                                data-testid="draw-detail-claim-prize-cta"
                            >
                                <ShieldCheck size={14} /> Claim your prize
                            </Button>
                        </Link>
                    </motion.div>
                )}
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Visual */}
                    <div
                        className="relative rounded-2xl overflow-hidden border aspect-[4/3]"
                        style={{
                            borderColor: 'var(--cs-border)',
                            backgroundColor: 'var(--cs-surface)',
                        }}
                    >
                        <img
                            src={draw.image_url}
                            alt={draw.title}
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div
                            className="absolute inset-0"
                            style={{
                                background:
                                    'radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 80%)',
                            }}
                        />
                        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                            <Badge
                                className="border"
                                style={{
                                    borderColor: 'rgba(201,168,76,0.35)',
                                    backgroundColor: 'rgba(10,10,15,0.7)',
                                    color: 'var(--cs-gold)',
                                }}
                            >
                                {draw.tier}
                            </Badge>
                            {isPhysical && !isUpcoming && (
                                <Badge
                                    className="border font-semibold tracking-wider"
                                    style={{
                                        backgroundColor: 'rgba(10,10,15,0.78)',
                                        borderColor: 'rgba(201,168,76,0.5)',
                                        color: 'var(--cs-gold)',
                                    }}
                                    data-testid="draw-detail-physical-badge"
                                >
                                    PHYSICAL PRIZE
                                </Badge>
                            )}
                            {isUpcoming && (
                                <Badge className="border" style={{ borderColor: 'var(--cs-border)' }}>
                                    Coming soon
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Info + entry */}
                    <div>
                        <div
                            className="text-xs uppercase tracking-widest"
                            style={{ color: 'var(--cs-text-muted)' }}
                        >
                            {draw.tier} · {draw.title}
                        </div>
                        <h1 className="cs-display text-4xl mt-1" style={{ color: 'var(--cs-text)' }}>
                            {draw.subtitle}
                        </h1>
                        <div className="mt-6">
                            {isJackpot ? (
                                <JackpotCounter drawId={draw.draw_id} initial={draw.jackpot_usdc} />
                            ) : isPhysical ? (
                                <div
                                    className="cs-display text-5xl sm:text-6xl tabular-nums"
                                    style={{ color: 'var(--cs-gold)' }}
                                    data-testid="draw-detail-prize-physical"
                                >
                                    {format(draw.prize_value_usd)}
                                </div>
                            ) : (
                                <div
                                    className="cs-display text-5xl sm:text-6xl tabular-nums"
                                    style={{ color: 'var(--cs-gold)' }}
                                    data-testid="draw-detail-prize-fixed"
                                >
                                    {format(draw.prize_fixed_usdc)}
                                </div>
                            )}
                            <div
                                className="mt-1 text-xs"
                                style={{ color: 'var(--cs-text-muted)' }}
                            >
                                {isJackpot
                                    ? 'Rolling USDC jackpot — grows until won'
                                    : isPhysical
                                      ? `Physical prize · ${draw.prize_label || 'Luxury asset'}`
                                      : 'Fixed USDC prize'}
                            </div>
                            {isPhysical && !isUpcoming && (
                                <div
                                    className="mt-3 flex flex-wrap items-center gap-3 text-xs"
                                    style={{ color: 'var(--cs-text-muted)' }}
                                    data-testid="draw-detail-winner-chooses"
                                >
                                    <span
                                        className="uppercase tracking-widest"
                                        style={{ color: 'var(--cs-gold)' }}
                                    >
                                        Winner chooses
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <Truck size={12} /> Take Delivery
                                    </span>
                                    <span className="opacity-40">·</span>
                                    <span className="inline-flex items-center gap-1">
                                        <Wallet size={12} /> Liquidate
                                    </span>
                                    <span className="opacity-40">·</span>
                                    <span className="inline-flex items-center gap-1">
                                        <TrendingUp size={12} /> Earn $1,500–$1,750/mo
                                    </span>
                                </div>
                            )}
                        </div>

                        {!isUpcoming && draw.next_draw_time && (
                            <div className="mt-7" data-testid="draw-detail-countdown-wrap">
                                <div
                                    className="text-xs uppercase tracking-widest mb-2"
                                    style={{ color: 'var(--cs-gold)' }}
                                >
                                    Time Until Draw
                                </div>
                                <CountdownTimer
                                    targetTime={draw.next_draw_time}
                                    size="hero"
                                />
                            </div>
                        )}

                        <Separator className="my-6" style={{ backgroundColor: 'var(--cs-border)' }} />

                        <div className="grid grid-cols-3 gap-4">
                            <InfoStat
                                icon={<Coins size={14} style={{ color: 'var(--cs-gold)' }} />}
                                label="Entry cost"
                                value={`${draw.entry_cost_coins} Coins`}
                                testid="draw-detail-entry-cost"
                            />
                            <InfoStat
                                icon={<Clock size={14} />}
                                label="Cadence"
                                value={cadence}
                                testid="draw-detail-cadence"
                            />
                            <InfoStat
                                icon={<Users size={14} />}
                                label="This cycle"
                                value={`${stats.total_entries} entries`}
                                testid="draw-detail-cycle-entries"
                            />
                        </div>

                        {!isUpcoming && (
                            <div
                                className="mt-6 rounded-2xl border p-5"
                                style={{
                                    backgroundColor: 'var(--cs-surface)',
                                    borderColor: 'var(--cs-border)',
                                }}
                                data-testid="entry-quantity-module"
                            >
                                <div
                                    className="text-xs uppercase tracking-widest"
                                    style={{ color: 'var(--cs-text-muted)' }}
                                >
                                    Choose your entries
                                </div>
                                <div className="mt-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-10 w-10 p-0 border"
                                            style={{
                                                borderColor: 'var(--cs-border)',
                                                color: 'var(--cs-text)',
                                            }}
                                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                            data-testid="entry-quantity-decrement"
                                            aria-label="Decrease quantity"
                                        >
                                            <Minus size={14} />
                                        </Button>
                                        <div
                                            className="cs-display text-4xl tabular-nums min-w-[60px] text-center"
                                            style={{ color: 'var(--cs-text)' }}
                                            data-testid="entry-quantity-value"
                                        >
                                            {quantity}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-10 w-10 p-0 border"
                                            style={{
                                                borderColor: 'var(--cs-border)',
                                                color: 'var(--cs-text)',
                                            }}
                                            onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                                            data-testid="entry-quantity-increment"
                                            aria-label="Increase quantity"
                                        >
                                            <Plus size={14} />
                                        </Button>
                                    </div>
                                    <div className="text-right">
                                        <div
                                            className="text-xs"
                                            style={{ color: 'var(--cs-text-muted)' }}
                                        >
                                            Total burn
                                        </div>
                                        <div
                                            className="cs-display text-2xl"
                                            style={{ color: 'var(--cs-gold)' }}
                                            data-testid="entry-total-burn"
                                        >
                                            {quantity * draw.entry_cost_coins} Coins
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={openModal}
                                    className="mt-5 w-full h-12 gap-2 font-medium"
                                    style={{
                                        backgroundColor: 'var(--cs-gold)',
                                        color: 'var(--cs-bg)',
                                    }}
                                    data-testid="entry-open-modal-button"
                                >
                                    <ShieldCheck size={16} /> Lock in entry
                                </Button>
                                <div
                                    className="mt-3 text-[11px]"
                                    style={{ color: 'var(--cs-text-muted)' }}
                                >
                                    Every entry receives a UUID + sha256 receipt. Winner selected via CSPRNG.
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Receipt */}
                {receipt && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-10"
                    >
                        <EntryReceipt entries={receipt} drawTitle={draw.title} jackpotAfter={jackpotAfter} />
                    </motion.div>
                )}
            </div>

            <BurnModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                quantity={quantity}
                entryCost={draw.entry_cost_coins}
                balance={user?.coin_balance}
                drawTitle={draw.title}
                onConfirm={confirmBurn}
                loading={burning}
            />
        </div>
    );
};

const InfoStat = ({ icon, label, value, testid }) => (
    <div
        data-testid={testid}
        className="rounded-lg border p-3"
        style={{
            borderColor: 'var(--cs-border)',
            backgroundColor: 'var(--cs-surface-2)',
        }}
    >
        <div
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest"
            style={{ color: 'var(--cs-text-muted)' }}
        >
            {icon}
            {label}
        </div>
        <div
            className="mt-1 text-sm font-semibold"
            style={{ color: 'var(--cs-text)' }}
        >
            {value}
        </div>
    </div>
);

export default DrawDetailPage;
