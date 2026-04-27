import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';
import Wordmark from '@/components/common/Wordmark';

const LoginPage = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [googleConfigured, setGoogleConfigured] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const next = params.get('next') || '/dashboard';

    useEffect(() => {
        if (user) navigate(next, { replace: true });
    }, [user, navigate, next]);

    useEffect(() => {
        api.get('/auth/google/config').then((r) => setGoogleConfigured(!!r.data?.configured)).catch(() => {});
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(form.email.trim(), form.password);
            toast.success('Welcome back');
            navigate(next, { replace: true });
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Unable to log in';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div data-testid="login-page" className="cs-grid-bg min-h-[calc(100vh-64px)] flex items-center">
            <div className="mx-auto w-full max-w-md px-4 py-14">
                <div className="text-center mb-8">
                    <Wordmark size="lg" />
                    <p className="mt-3 text-sm" style={{ color: 'var(--cs-text-muted)' }}>
                        Log in to enter draws and track your Cipher Coins.
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
                        <Label htmlFor="login-email" className="text-xs" style={{ color: 'var(--cs-text-muted)' }}>
                            Email
                        </Label>
                        <Input
                            id="login-email"
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
                        <Label htmlFor="login-password" className="text-xs" style={{ color: 'var(--cs-text-muted)' }}>
                            Password
                        </Label>
                        <Input
                            id="login-password"
                            type="password"
                            required
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
                    <Button
                        type="submit"
                        disabled={loading}
                        data-testid="auth-submit-button"
                        className="w-full h-11 font-medium"
                        style={{ backgroundColor: 'var(--cs-gold)', color: 'var(--cs-bg)' }}
                    >
                        {loading ? 'Signing in…' : 'Log in'}
                    </Button>
                    {googleConfigured && (
                        <a href={`${process.env.REACT_APP_BACKEND_URL}/api/auth/google/login`}>
                            <Button
                                type="button"
                                variant="ghost"
                                data-testid="auth-google-button"
                                className="w-full h-11 border"
                                style={{
                                    borderColor: 'var(--cs-border)',
                                    color: 'var(--cs-text)',
                                }}
                            >
                                Continue with Google
                            </Button>
                        </a>
                    )}
                    {!googleConfigured && (
                        <div
                            className="text-[11px] text-center"
                            style={{ color: 'var(--cs-text-muted)' }}
                            data-testid="google-not-configured-note"
                        >
                            Google sign-in requires Client ID/Secret in backend/.env.
                        </div>
                    )}
                    <div className="text-xs text-center" style={{ color: 'var(--cs-text-muted)' }}>
                        New to CipherStakes?{' '}
                        <Link to="/register" className="underline" style={{ color: 'var(--cs-gold)' }}>
                            Create your account
                        </Link>
                    </div>
                </form>
                <p className="mt-4 text-[11px] text-center" style={{ color: 'var(--cs-text-muted)' }}>
                    CipherStakes is a sweepstakes platform. No purchase necessary. Void where prohibited.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
