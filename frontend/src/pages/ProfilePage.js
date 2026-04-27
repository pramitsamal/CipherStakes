import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const ProfilePage = () => {
    const { user, refreshUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [wins, setWins] = useState([]);
    const [kyc, setKyc] = useState({
        full_name: '',
        country: '',
        id_number: '',
        wallet_address: '',
        bank_details: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        const [tx, w] = await Promise.all([
            api.get('/users/me/transactions'),
            api.get('/users/me/wins'),
        ]);
        setTransactions(tx.data || []);
        setWins(w.data || []);
    }, []);

    useEffect(() => {
        load().catch(() => {});
    }, [load]);

    const submitKyc = async (e) => {
        e.preventDefault();
        if (!kyc.full_name || !kyc.country || !kyc.id_number) {
            toast.error('Fill in required fields');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/users/me/kyc', kyc);
            toast.success('KYC submitted — you’ll hear back within 48h');
            await refreshUser();
        } catch (_err) {
            toast.error('Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const kycStatus = user?.kyc_status || 'not_required';
    const hasWins = wins.length > 0;

    return (
        <div data-testid="profile-page" className="cs-grid-bg">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-8">
                    <div
                        className="text-xs uppercase tracking-widest"
                        style={{ color: 'var(--cs-text-muted)' }}
                    >
                        Account
                    </div>
                    <h1 className="cs-display text-3xl mt-1" style={{ color: 'var(--cs-text)' }}>
                        {user?.email}
                    </h1>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Badge
                            className="border"
                            style={{
                                borderColor: 'var(--cs-border)',
                                color: user?.email_verified ? 'var(--cs-success)' : 'var(--cs-text-muted)',
                            }}
                        >
                            {user?.email_verified ? 'Email verified' : 'Email not verified'}
                        </Badge>
                        <Badge
                            className="border"
                            style={{
                                borderColor: 'var(--cs-border)',
                                color: kycStatus === 'submitted' ? 'var(--cs-success)' : 'var(--cs-text-muted)',
                            }}
                            data-testid="profile-kyc-status"
                        >
                            KYC: {kycStatus.replace('_', ' ')}
                        </Badge>
                    </div>
                </div>

                {/* Wins */}
                <section
                    className="rounded-2xl border p-6 mb-8"
                    style={{
                        backgroundColor: 'var(--cs-surface)',
                        borderColor: 'var(--cs-border)',
                    }}
                    data-testid="profile-wins-section"
                >
                    <h2 className="cs-display text-xl mb-3" style={{ color: 'var(--cs-text)' }}>
                        Your wins
                    </h2>
                    {!hasWins ? (
                        <p className="text-sm" style={{ color: 'var(--cs-text-muted)' }}>
                            No wins yet. Every draw is a new chance.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {wins.map((w) => (
                                <div
                                    key={`${w.draw_id}_${w.cycle}`}
                                    className="flex items-center justify-between text-sm border-b last:border-b-0 py-2"
                                    style={{ borderColor: 'var(--cs-border)' }}
                                >
                                    <span style={{ color: 'var(--cs-text)' }}>
                                        {w.draw_id} • {w.cycle}
                                    </span>
                                    <span className="cs-display" style={{ color: 'var(--cs-gold)' }}>
                                        ${Number(w.prize_usdc || 0).toLocaleString()} USDC
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* KYC */}
                <section
                    className="rounded-2xl border p-6 mb-8"
                    style={{
                        backgroundColor: 'var(--cs-surface)',
                        borderColor: 'var(--cs-border)',
                    }}
                    data-testid="kyc-form"
                >
                    <h2 className="cs-display text-xl mb-1" style={{ color: 'var(--cs-text)' }}>
                        Prize claim / KYC
                    </h2>
                    <p className="text-sm mb-4" style={{ color: 'var(--cs-text-muted)' }}>
                        Submit once you win — or pre-submit to speed up your payout. All data is stored securely and reviewed by our compliance team.
                    </p>
                    <form onSubmit={submitKyc} className="grid gap-4 sm:grid-cols-2">
                        <Field
                            id="kyc-name"
                            label="Full legal name *"
                            value={kyc.full_name}
                            onChange={(v) => setKyc((k) => ({ ...k, full_name: v }))}
                        />
                        <Field
                            id="kyc-country"
                            label="Country *"
                            value={kyc.country}
                            onChange={(v) => setKyc((k) => ({ ...k, country: v }))}
                        />
                        <Field
                            id="kyc-idnumber"
                            label="National ID / Passport # *"
                            value={kyc.id_number}
                            onChange={(v) => setKyc((k) => ({ ...k, id_number: v }))}
                        />
                        <Field
                            id="kyc-wallet"
                            label="USDC wallet address (optional)"
                            value={kyc.wallet_address}
                            onChange={(v) => setKyc((k) => ({ ...k, wallet_address: v }))}
                        />
                        <div className="sm:col-span-2">
                            <Field
                                id="kyc-bank"
                                label="Bank transfer details (optional)"
                                value={kyc.bank_details}
                                onChange={(v) => setKyc((k) => ({ ...k, bank_details: v }))}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="h-11 font-medium"
                                style={{
                                    backgroundColor: 'var(--cs-gold)',
                                    color: 'var(--cs-bg)',
                                }}
                                data-testid="kyc-submit-button"
                            >
                                {submitting ? 'Submitting…' : 'Submit KYC'}
                            </Button>
                        </div>
                    </form>
                </section>

                {/* Transactions */}
                <section
                    className="rounded-2xl border p-6"
                    style={{
                        backgroundColor: 'var(--cs-surface)',
                        borderColor: 'var(--cs-border)',
                    }}
                    data-testid="profile-transactions-section"
                >
                    <h2 className="cs-display text-xl mb-3" style={{ color: 'var(--cs-text)' }}>
                        Transaction history
                    </h2>
                    {transactions.length === 0 ? (
                        <p className="text-sm" style={{ color: 'var(--cs-text-muted)' }}>
                            No pack purchases yet.
                        </p>
                    ) : (
                        <div className="space-y-0">
                            {transactions.map((t) => (
                                <div
                                    key={t.session_id}
                                    className="grid grid-cols-1 sm:grid-cols-4 gap-2 py-3 border-b last:border-b-0 text-sm"
                                    style={{ borderColor: 'var(--cs-border)' }}
                                >
                                    <span style={{ color: 'var(--cs-text)' }}>
                                        {t.pack_name || t.pack_id}
                                    </span>
                                    <span style={{ color: 'var(--cs-text-muted)' }}>
                                        ${Number(t.amount_usd || 0).toFixed(2)}
                                    </span>
                                    <span style={{ color: 'var(--cs-gold)' }}>
                                        +{Number(t.coins || 0).toLocaleString()} Coins
                                    </span>
                                    <span
                                        style={{
                                            color:
                                                t.status === 'completed'
                                                    ? 'var(--cs-success)'
                                                    : 'var(--cs-text-muted)',
                                        }}
                                    >
                                        {t.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                    <Separator className="my-4" style={{ backgroundColor: 'var(--cs-border)' }} />
                    <p className="text-[11px]" style={{ color: 'var(--cs-text-muted)' }}>
                        Cipher Gold purchases never expire. Coin balances carry over indefinitely.
                    </p>
                </section>
            </div>
        </div>
    );
};

const Field = ({ id, label, value, onChange }) => (
    <div>
        <Label htmlFor={id} className="text-xs" style={{ color: 'var(--cs-text-muted)' }}>
            {label}
        </Label>
        <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1"
            style={{
                backgroundColor: 'var(--cs-surface-2)',
                borderColor: 'var(--cs-border)',
                color: 'var(--cs-text)',
            }}
        />
    </div>
);

export default ProfilePage;
