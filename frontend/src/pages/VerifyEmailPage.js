import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VerifyEmailPage = () => {
    const [params] = useSearchParams();
    const token = params.get('token');
    const [status, setStatus] = useState('loading');
    const [bonus, setBonus] = useState(0);
    const { refreshUser } = useAuth();

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }
        (async () => {
            try {
                const res = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
                setStatus('ok');
                setBonus(res.data?.bonus_coins || 0);
                refreshUser();
            } catch (_err) {
                setStatus('error');
            }
        })();
    }, [token, refreshUser]);

    return (
        <div data-testid="verify-email-page" className="mx-auto max-w-md px-4 py-20">
            <div
                className="rounded-2xl border p-8 text-center"
                style={{
                    backgroundColor: 'var(--cs-surface)',
                    borderColor: 'var(--cs-border)',
                }}
            >
                {status === 'loading' && (
                    <div style={{ color: 'var(--cs-text-muted)' }}>Verifying your email…</div>
                )}
                {status === 'ok' && (
                    <div>
                        <CheckCircle2
                            size={48}
                            className="mx-auto"
                            style={{ color: 'var(--cs-success)' }}
                        />
                        <h1 className="cs-display text-2xl mt-4" style={{ color: 'var(--cs-text)' }}>
                            Email verified
                        </h1>
                        <p className="mt-2 text-sm" style={{ color: 'var(--cs-text-muted)' }}>
                            {bonus > 0
                                ? `Bonus: +${bonus} Cipher Coins added to your balance.`
                                : 'Your email has been verified.'}
                        </p>
                        <Link to="/dashboard">
                            <Button
                                className="mt-6"
                                style={{
                                    backgroundColor: 'var(--cs-gold)',
                                    color: 'var(--cs-bg)',
                                }}
                                data-testid="verify-email-cta-dashboard"
                            >
                                Go to dashboard
                            </Button>
                        </Link>
                    </div>
                )}
                {status === 'error' && (
                    <div>
                        <AlertCircle size={48} className="mx-auto text-red-400" />
                        <h1 className="cs-display text-2xl mt-4" style={{ color: 'var(--cs-text)' }}>
                            Verification failed
                        </h1>
                        <p className="mt-2 text-sm" style={{ color: 'var(--cs-text-muted)' }}>
                            This link may have expired or already been used.
                        </p>
                        <Link to="/dashboard">
                            <Button className="mt-6" variant="ghost">
                                Return to dashboard
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
