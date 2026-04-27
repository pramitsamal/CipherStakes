import React, { useEffect, useState } from 'react';
import { Coins, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const PackStorePage = () => {
    const [packs, setPacks] = useState([]);
    const [loadingPack, setLoadingPack] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/packs').then((r) => setPacks(r.data || []));
    }, []);

    const handleBuy = async (packId) => {
        if (!user) {
            toast.message('Log in to purchase a pack');
            navigate('/login?next=/store');
            return;
        }
        setLoadingPack(packId);
        try {
            const res = await api.post('/packs/checkout', {
                pack_id: packId,
                origin_url: window.location.origin,
            });
            if (res.data?.url) {
                window.location.href = res.data.url;
            } else {
                toast.error('Unable to start checkout');
            }
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Checkout failed';
            toast.error(msg);
        } finally {
            setLoadingPack(null);
        }
    };

    return (
        <div data-testid="pack-store-page" className="cs-grid-bg">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-2xl">
                    <div
                        className="text-xs uppercase tracking-widest"
                        style={{ color: 'var(--cs-text-muted)' }}
                    >
                        Cipher Gold packs
                    </div>
                    <h1 className="cs-display text-4xl mt-1" style={{ color: 'var(--cs-text)' }}>
                        Purchase Cipher Gold.
                    </h1>
                    <p className="mt-3 text-sm" style={{ color: 'var(--cs-text-muted)' }}>
                        Cipher Gold is a record of your real-money purchase and has no prize value.
                        Every purchase credits Cipher Coins (entry currency). No purchase is ever required — claim free Coins daily.
                    </p>
                </div>
                <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                    {packs.map((p) => (
                        <div
                            key={p.id}
                            data-testid={`pack-tier-card-${p.id}`}
                            className={`relative rounded-2xl border p-5 flex flex-col transition-colors ${
                                p.featured
                                    ? 'border-[rgba(201,168,76,0.4)]'
                                    : 'border-[color:var(--cs-border)]'
                            } hover:border-[rgba(201,168,76,0.4)] hover:shadow-[var(--cs-glow-gold)]`}
                            style={{
                                backgroundColor: 'var(--cs-surface)',
                                boxShadow: p.featured
                                    ? '0 18px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,168,76,0.2)'
                                    : 'var(--cs-shadow)',
                            }}
                        >
                            {p.featured && (
                                <Badge
                                    className="absolute -top-2.5 left-5 border"
                                    style={{
                                        backgroundColor: 'var(--cs-bg)',
                                        borderColor: 'rgba(201,168,76,0.35)',
                                        color: 'var(--cs-gold)',
                                    }}
                                >
                                    Best value
                                </Badge>
                            )}
                            <div
                                className="text-xs uppercase tracking-widest"
                                style={{ color: 'var(--cs-text-muted)' }}
                            >
                                {p.name}
                            </div>
                            <div
                                className="cs-display text-4xl mt-2"
                                style={{ color: 'var(--cs-gold)' }}
                                data-testid={`pack-price-${p.id}`}
                            >
                                ${p.price_usd.toFixed(2)}
                            </div>
                            <div
                                className="mt-3 inline-flex items-center gap-2 text-sm"
                                style={{ color: 'var(--cs-text)' }}
                            >
                                <Coins size={14} style={{ color: 'var(--cs-gold)' }} />
                                <span
                                    className="font-semibold tabular-nums"
                                    data-testid={`pack-coins-${p.id}`}
                                >
                                    {p.coins.toLocaleString()}
                                </span>
                                Cipher Coins
                            </div>
                            {p.bonus_label && (
                                <div
                                    className="mt-2 inline-flex items-center gap-1 text-xs"
                                    style={{ color: 'var(--cs-violet-2)' }}
                                >
                                    <Sparkles size={12} /> {p.bonus_label}
                                </div>
                            )}
                            <div className="flex-1" />
                            <Button
                                onClick={() => handleBuy(p.id)}
                                disabled={loadingPack === p.id}
                                className="mt-5 w-full h-11 font-medium"
                                style={{
                                    backgroundColor: 'var(--cs-gold)',
                                    color: 'var(--cs-bg)',
                                }}
                                data-testid={`pack-buy-button-${p.id}`}
                            >
                                {loadingPack === p.id ? 'Redirecting…' : 'Buy pack'}
                            </Button>
                        </div>
                    ))}
                </div>
                <p
                    className="mt-8 text-[11px] max-w-3xl"
                    style={{ color: 'var(--cs-text-muted)' }}
                >
                    Payments are processed by Stripe. Coins are credited to your account on successful payment. Purchases do not increase your chances of winning beyond the amount of Cipher Coins received.
                </p>
            </div>
        </div>
    );
};

export default PackStorePage;
