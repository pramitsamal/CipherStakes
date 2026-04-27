import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Trophy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const formatCurrency = (n) =>
    Number(n || 0).toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    });

const truncate = (s, n = 18) =>
    s && s.length > n ? `${s.slice(0, n / 2)}…${s.slice(-n / 2)}` : s;

const ResultsPage = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [skip, setSkip] = useState(0);
    const [total, setTotal] = useState(0);
    const [running, setRunning] = useState(null);
    const [demoing, setDemoing] = useState(false);
    const limit = 20;
    const { user } = useAuth();
    const navigate = useNavigate();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/draws/results/all?skip=${skip}&limit=${limit}`);
            setResults(res.data.results || []);
            setTotal(res.data.total || 0);
        } finally {
            setLoading(false);
        }
    }, [skip]);

    useEffect(() => {
        load();
    }, [load]);

    const runDemo = async (drawId) => {
        setRunning(drawId);
        try {
            const res = await api.post(`/draws/admin/run/${drawId}`);
            if (res.data.winner) {
                toast.success(`Winner selected for ${drawId}`);
            } else {
                toast.message(`${drawId}: no entries yet; rolled over.`);
            }
            await load();
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Run failed';
            toast.error(msg);
        } finally {
            setRunning(null);
        }
    };

    const demoT3Win = async () => {
        if (!user) {
            toast.message('Log in to demo a T3 win');
            navigate('/login?next=/results');
            return;
        }
        setDemoing(true);
        try {
            const res = await api.post('/draws/admin/demo-win/T3_BIWEEKLY_RIDE');
            const claimId = res.data?.winner_claim_id;
            if (claimId) {
                toast.success('Demo T3 win created — opening redemption flow');
                navigate(`/redeem/${claimId}`);
            } else {
                toast.error('Could not create demo win');
            }
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Demo failed';
            toast.error(typeof msg === 'string' ? msg : 'Demo failed');
        } finally {
            setDemoing(false);
        }
    };

    const copy = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied`);
        } catch (_e) {
            toast.error('Copy failed');
        }
    };

    return (
        <div data-testid="results-page" className="cs-grid-bg">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="cs-display text-4xl" style={{ color: 'var(--cs-text)' }}>
                            Public results feed
                        </h1>
                        <p
                            className="mt-2 text-sm max-w-xl"
                            style={{ color: 'var(--cs-text-muted)' }}
                        >
                            Every executed draw, verifiable winning entry ID, and receipt hash. CipherStakes uses cryptographically secure RNG (CSPRNG) for winner selection.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2" data-testid="results-demo-run">
                        <Button
                            onClick={() => runDemo('T1_DAILY_FLASH')}
                            disabled={running === 'T1_DAILY_FLASH'}
                            variant="ghost"
                            className="border text-xs"
                            style={{ borderColor: 'var(--cs-border)', color: 'var(--cs-gold)' }}
                            data-testid="results-run-t1-button"
                        >
                            Run T1 now (demo)
                        </Button>
                        <Button
                            onClick={() => runDemo('T2_WEEKLY_STAKES')}
                            disabled={running === 'T2_WEEKLY_STAKES'}
                            variant="ghost"
                            className="border text-xs"
                            style={{ borderColor: 'var(--cs-border)', color: 'var(--cs-gold)' }}
                            data-testid="results-run-t2-button"
                        >
                            Run T2 now (demo)
                        </Button>
                        <Button
                            onClick={() => runDemo('T3_BIWEEKLY_RIDE')}
                            disabled={running === 'T3_BIWEEKLY_RIDE'}
                            variant="ghost"
                            className="border text-xs"
                            style={{ borderColor: 'var(--cs-border)', color: 'var(--cs-gold)' }}
                            data-testid="results-run-t3-button"
                        >
                            Run T3 now (demo)
                        </Button>
                        <Button
                            onClick={demoT3Win}
                            disabled={demoing}
                            className="text-xs gap-2 font-medium"
                            style={{
                                backgroundColor: 'var(--cs-gold)',
                                color: 'var(--cs-bg)',
                            }}
                            data-testid="results-demo-t3-win-button"
                        >
                            <Sparkles size={12} />
                            {demoing ? 'Creating win…' : 'Demo T3 Win'}
                        </Button>
                    </div>
                </div>

                <div
                    className="rounded-2xl border overflow-hidden"
                    style={{
                        backgroundColor: 'var(--cs-surface)',
                        borderColor: 'var(--cs-border)',
                    }}
                    data-testid="results-table"
                >
                    <div
                        className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 text-[11px] uppercase tracking-widest border-b"
                        style={{
                            borderColor: 'var(--cs-border)',
                            color: 'var(--cs-text-muted)',
                            backgroundColor: 'var(--cs-surface-2)',
                        }}
                    >
                        <div className="col-span-2">Draw</div>
                        <div className="col-span-2">Cycle</div>
                        <div className="col-span-2">Executed</div>
                        <div className="col-span-3">Winning entry</div>
                        <div className="col-span-2">Prize</div>
                        <div className="col-span-1">Status</div>
                    </div>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-14 border-b animate-pulse"
                                style={{ borderColor: 'var(--cs-border)' }}
                            />
                        ))
                    ) : results.length === 0 ? (
                        <div
                            className="p-10 text-center text-sm"
                            style={{ color: 'var(--cs-text-muted)' }}
                            data-testid="results-empty"
                        >
                            No draws have executed yet. Use “Run T1 now” above to demo a draw.
                        </div>
                    ) : (
                        results.map((r) => (
                            <div
                                key={`${r.draw_id}_${r.cycle}`}
                                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 border-b last:border-b-0 items-center"
                                style={{ borderColor: 'var(--cs-border)' }}
                                data-testid={`results-row-${r.draw_id}-${r.cycle}`}
                            >
                                <div className="sm:col-span-2 text-sm" style={{ color: 'var(--cs-text)' }}>
                                    {r.draw_id}
                                </div>
                                <div
                                    className="sm:col-span-2 text-xs"
                                    style={{ color: 'var(--cs-text-muted)' }}
                                >
                                    {r.cycle}
                                </div>
                                <div
                                    className="sm:col-span-2 text-xs"
                                    style={{ color: 'var(--cs-text-muted)' }}
                                >
                                    {new Date(r.executed_at).toUTCString()}
                                </div>
                                <div className="sm:col-span-3 flex items-center gap-2">
                                    {r.winning_entry_id ? (
                                        <>
                                            <span
                                                className="cs-mono text-xs rounded-md border px-2 py-1"
                                                style={{
                                                    borderColor: 'rgba(201,168,76,0.3)',
                                                    backgroundColor: 'rgba(201,168,76,0.05)',
                                                    color: 'var(--cs-gold)',
                                                }}
                                                data-testid="results-winning-entry-id"
                                            >
                                                {truncate(r.winning_entry_id, 16)}
                                            </span>
                                            <button
                                                className="p-1 rounded hover:bg-white/5"
                                                onClick={() => copy(r.winning_entry_id, 'Entry ID')}
                                                aria-label="Copy entry ID"
                                            >
                                                <Copy size={12} style={{ color: 'var(--cs-gold)' }} />
                                            </button>
                                        </>
                                    ) : (
                                        <span
                                            className="text-xs"
                                            style={{ color: 'var(--cs-text-muted)' }}
                                        >
                                            No entries — rolled over
                                        </span>
                                    )}
                                </div>
                                <div
                                    className="sm:col-span-2 cs-display text-lg"
                                    style={{ color: 'var(--cs-gold)' }}
                                >
                                    {formatCurrency(r.prize_usdc)}
                                </div>
                                <div className="sm:col-span-1">
                                    <Badge
                                        className="border"
                                        style={{
                                            borderColor: 'var(--cs-border)',
                                            color:
                                                r.status === 'won'
                                                    ? 'var(--cs-success)'
                                                    : 'var(--cs-text-muted)',
                                        }}
                                    >
                                        {r.status === 'won' ? (
                                            <>
                                                <Trophy size={10} className="mr-1" /> Won
                                            </>
                                        ) : (
                                            'Rolled over'
                                        )}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {total > limit && (
                    <div className="mt-4 flex justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={skip === 0}
                            onClick={() => setSkip((s) => Math.max(0, s - limit))}
                            className="border"
                            style={{ borderColor: 'var(--cs-border)', color: 'var(--cs-text-muted)' }}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={skip + limit >= total}
                            onClick={() => setSkip((s) => s + limit)}
                            className="border"
                            style={{ borderColor: 'var(--cs-border)', color: 'var(--cs-text-muted)' }}
                            data-testid="results-pagination-next"
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultsPage;
