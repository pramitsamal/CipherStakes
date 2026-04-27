import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const POLL_INTERVAL = 2500;
const MAX_ATTEMPTS = 20;

const CheckoutStatusPage = () => {
    const [params] = useSearchParams();
    const sessionId = params.get('session_id');
    const [state, setState] = useState('checking');
    const [details, setDetails] = useState(null);
    const { refreshUser } = useAuth();
    const attemptsRef = useRef(0);
    const stoppedRef = useRef(false);

    useEffect(() => {
        if (!sessionId) {
            setState('error');
            return;
        }

        const poll = async () => {
            if (stoppedRef.current) return;
            if (attemptsRef.current >= MAX_ATTEMPTS) {
                setState('timeout');
                return;
            }
            attemptsRef.current += 1;
            try {
                const res = await api.get(`/packs/checkout/status/${encodeURIComponent(sessionId)}`);
                setDetails(res.data);
                if (res.data.payment_status === 'paid') {
                    setState('success');
                    stoppedRef.current = true;
                    refreshUser();
                    return;
                }
                if (res.data.status === 'expired') {
                    setState('expired');
                    stoppedRef.current = true;
                    return;
                }
            } catch (_err) {
                setState('error');
                stoppedRef.current = true;
                return;
            }
            setTimeout(poll, POLL_INTERVAL);
        };
        poll();
        return () => {
            stoppedRef.current = true;
        };
    }, [sessionId, refreshUser]);

    return (
        <div data-testid="checkout-status-page" className="min-h-[60vh] cs-grid-bg flex items-center justify-center px-4 py-16">
            <div
                className="max-w-md w-full rounded-2xl border p-8 text-center"
                style={{
                    backgroundColor: 'var(--cs-surface)',
                    borderColor: 'var(--cs-border)',
                }}
            >
                {state === 'checking' && (
                    <div data-testid="checkout-state-checking">
                        <Loader2
                            size={48}
                            className="mx-auto animate-spin"
                            style={{ color: 'var(--cs-gold)' }}
                        />
                        <h1 className="cs-display text-2xl mt-4" style={{ color: 'var(--cs-text)' }}>
                            Finalizing your purchase
                        </h1>
                        <p className="mt-2 text-sm" style={{ color: 'var(--cs-text-muted)' }}>
                            This usually takes a few seconds.
                        </p>
                    </div>
                )}
                {state === 'success' && (
                    <div data-testid="checkout-state-success">
                        <CheckCircle2 size={48} className="mx-auto" style={{ color: 'var(--cs-success)' }} />
                        <h1 className="cs-display text-2xl mt-4" style={{ color: 'var(--cs-text)' }}>
                            Payment received
                        </h1>
                        {details?.coins_credited > 0 && (
                            <p className="mt-2 text-sm" style={{ color: 'var(--cs-text-muted)' }}>
                                +{details.coins_credited.toLocaleString()} Cipher Coins added to your balance.
                            </p>
                        )}
                        <Link to="/dashboard">
                            <Button
                                className="mt-6 w-full"
                                style={{ backgroundColor: 'var(--cs-gold)', color: 'var(--cs-bg)' }}
                                data-testid="checkout-success-cta-dashboard"
                            >
                                Go to dashboard
                            </Button>
                        </Link>
                    </div>
                )}
                {state === 'expired' && (
                    <ErrorBlock title="Checkout session expired" body="Please start a new purchase." />
                )}
                {state === 'timeout' && (
                    <ErrorBlock
                        title="Still processing…"
                        body="We'll credit your Coins once Stripe confirms the payment. Check your dashboard shortly."
                    />
                )}
                {state === 'error' && (
                    <ErrorBlock title="Something went wrong" body="Please check your dashboard or try again." />
                )}
            </div>
        </div>
    );
};

const ErrorBlock = ({ title, body }) => (
    <div>
        <XCircle size={48} className="mx-auto text-red-400" />
        <h1 className="cs-display text-2xl mt-4" style={{ color: 'var(--cs-text)' }}>
            {title}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--cs-text-muted)' }}>
            {body}
        </p>
        <div className="mt-6 flex flex-col gap-2">
            <Link to="/store">
                <Button
                    variant="ghost"
                    className="w-full border"
                    style={{ borderColor: 'var(--cs-border)', color: 'var(--cs-text)' }}
                >
                    Back to store
                </Button>
            </Link>
            <Link to="/dashboard">
                <Button
                    className="w-full"
                    style={{ backgroundColor: 'var(--cs-gold)', color: 'var(--cs-bg)' }}
                >
                    Dashboard
                </Button>
            </Link>
        </div>
    </div>
);

export default CheckoutStatusPage;
