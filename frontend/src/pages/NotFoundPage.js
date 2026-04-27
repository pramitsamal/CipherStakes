import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFoundPage = () => (
    <div
        data-testid="not-found-page"
        className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 text-center"
    >
        <div className="cs-display text-5xl" style={{ color: 'var(--cs-gold)' }}>
            404
        </div>
        <p className="mt-3" style={{ color: 'var(--cs-text-muted)' }}>
            That page wandered off. Try the active draws instead.
        </p>
        <Link to="/draws" className="mt-6">
            <Button style={{ backgroundColor: 'var(--cs-gold)', color: 'var(--cs-bg)' }}>
                View active draws
            </Button>
        </Link>
    </div>
);

export default NotFoundPage;
