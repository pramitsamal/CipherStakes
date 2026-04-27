import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const OAuthSuccessPage = () => {
    const [params] = useSearchParams();
    const { loginWithToken } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const token = params.get('token');
        if (!token) {
            navigate('/login', { replace: true });
            return;
        }
        (async () => {
            await loginWithToken(token);
            navigate('/dashboard', { replace: true });
        })();
    }, [params, loginWithToken, navigate]);

    return (
        <div
            data-testid="oauth-success-page"
            className="min-h-[60vh] flex items-center justify-center"
            style={{ color: 'var(--cs-text-muted)' }}
        >
            Finishing sign-in…
        </div>
    );
};

export default OAuthSuccessPage;
