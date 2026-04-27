import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) {
        return (
            <div
                data-testid="private-route-loading"
                className="min-h-screen flex items-center justify-center"
                style={{ color: 'var(--cs-text-muted)' }}
            >
                Loading…
            </div>
        );
    }
    if (!user) {
        return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
    }
    return children;
};

export default PrivateRoute;
