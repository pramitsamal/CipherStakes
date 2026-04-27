import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Wordmark from '@/components/common/Wordmark';

const RegisterPage = () => {
    const [form, setForm] = useState({ email: '', password: '', referral: '' });
    const [loading, setLoading] = useState(false);
    const { register, user } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();

    useEffect(() => {
        const ref = params.get('ref');
        if (ref) setForm((f) => ({ ...f, referral: ref.toUpperCase() }));
    }, [params]);

    useEffect(() => {
        if (user) navigate('/dashboard', { replace: true });
    }, [user, navigate]);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            await register(form.email.trim().toLowerCase(), form.password, form.referral || null);
            toast.success('Welcome to CipherStakes — 50 Coins credited.');
            navigate('/dashboard', { replace: true });
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Registration failed';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div data-testid="register-page" className="cs-grid-bg min-h-[calc(100vh-64px)] flex items-center">
            <div className="mx-auto w-full max-w-md px-4 py-14">
                <div className="text-center mb-8">
                    <Wordmark size="lg" />
                    <p className="mt-3 text-sm" style={{ color: 'var(--cs-text-muted)' }}>
                        Create an account to claim 50 Cipher Coins and enter your first draw.
                    </p>
                </div>
                <form
                    onSubmit={onSubmit}
                    className="rounded-2xl border p-6 space-y-4"
                    style={{
                        backgroundColor: 'var(--cs-surface)',
                        borderColor: 'var(--cs-border)',
                    }}
                >
                    <div>
                        <Label htmlFor="reg-email" className="text-xs" style={{ color: 'var(--cs-text-muted)' }}>
                            Email
                        </Label>
                        <Input
                            id="reg-email"
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            data-testid="auth-email-input"
                            className="mt-1"
                            style={{
                                backgroundColor: 'var(--cs-surface-2)',
                                borderColor: 'var(--cs-border)',
                                color: 'var(--cs-text)',
                            }}
                        />
                    </div>
                    <div>
                        <Label htmlFor="reg-password" className="text-xs" style={{ color: 'var(--cs-text-muted)' }}>
                            Password (min 6 chars)
                        </Label>
                        <Input
                            id="reg-password"
                            type="password"
                            required
                            minLength={6}
                            value={form.password}
                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                            data-testid="auth-password-input"
                            className="mt-1"
                            style={{
                                backgroundColor: 'var(--cs-surface-2)',
                                borderColor: 'var(--cs-border)',
                                color: 'var(--cs-text)',
                            }}
                        />
                    </div>
                    <div>
                        <Label htmlFor="reg-referral" className="text-xs" style={{ color: 'var(--cs-text-muted)' }}>
                            Referral code (optional)
                        </Label>
                        <Input
                            id="reg-referral"
                            type="text"
                            value={form.referral}
                            onChange={(e) => setForm((f) => ({ ...f, referral: e.target.value.toUpperCase() }))}
                            data-testid="auth-referral-input"
                            className="mt-1"
                            style={{
                                backgroundColor: 'var(--cs-surface-2)',
                                borderColor: 'var(--cs-border)',
                                color: 'var(--cs-text)',
                            }}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        data-testid="auth-submit-button"
                        className="w-full h-11 font-medium"
                        style={{ backgroundColor: 'var(--cs-gold)', color: 'var(--cs-bg)' }}
                    >
                        {loading ? 'Creating your account…' : 'Create account'}
                    </Button>
                    <div className="text-xs text-center" style={{ color: 'var(--cs-text-muted)' }}>
                        Already have an account?{' '}
                        <Link to="/login" className="underline" style={{ color: 'var(--cs-gold)' }}>
                            Log in
                        </Link>
                    </div>
                </form>
                <p className="mt-4 text-[11px] text-center" style={{ color: 'var(--cs-text-muted)' }}>
                    By creating an account you acknowledge CipherStakes is a sweepstakes platform (not gambling). KYC required only before prize release.
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
