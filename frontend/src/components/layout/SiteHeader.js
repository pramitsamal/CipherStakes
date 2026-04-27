import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Wordmark from '@/components/common/Wordmark';
import CoinBalancePill from '@/components/common/CoinBalancePill';

const linkClass = ({ isActive }) =>
    `px-3 py-2 text-sm transition-colors ${
        isActive
            ? 'text-[color:var(--cs-text)]'
            : 'text-[color:var(--cs-text-muted)] hover:text-[color:var(--cs-text)]'
    }`;

const PublicLinks = () => (
    <>
        <NavLink to="/draws" data-testid="nav-draws-link" className={linkClass}>Draws</NavLink>
        <NavLink to="/results" data-testid="nav-results-link" className={linkClass}>Results</NavLink>
        <NavLink to="/store" data-testid="nav-store-link" className={linkClass}>Store</NavLink>
        <NavLink to="/how-it-works" data-testid="nav-how-link" className={linkClass}>How it works</NavLink>
    </>
);

const AuthedLinks = () => (
    <>
        <NavLink to="/dashboard" data-testid="nav-dashboard-link" className={linkClass}>Dashboard</NavLink>
        <NavLink to="/draws" data-testid="nav-draws-link" className={linkClass}>Draws</NavLink>
        <NavLink to="/store" data-testid="nav-store-link" className={linkClass}>Store</NavLink>
        <NavLink to="/results" data-testid="nav-results-link" className={linkClass}>Results</NavLink>
    </>
);

const SiteHeader = () => {
    const { user, logout } = useAuth();
    const [open, setOpen] = React.useState(false);
    const location = useLocation();

    React.useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    return (
        <header
            data-testid="site-header"
            className="sticky top-0 z-40 border-b border-[color:var(--cs-border)] backdrop-blur-md"
            style={{ backgroundColor: 'rgba(10,10,15,0.78)' }}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-4">
                    <Link to="/" className="flex items-center gap-2" data-testid="header-home-link">
                        <Wordmark />
                    </Link>
                    <nav className="hidden md:flex items-center gap-1">
                        {user ? <AuthedLinks /> : <PublicLinks />}
                    </nav>
                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                <CoinBalancePill balance={user.coin_balance} />
                                <Link to="/profile" className="hidden md:block">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-[color:var(--cs-text)] border border-[color:var(--cs-border)] hover:bg-white/5"
                                        data-testid="header-profile-button"
                                    >
                                        Profile
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={logout}
                                    data-testid="header-logout-button"
                                    className="hidden md:inline-flex text-[color:var(--cs-text-muted)] hover:text-[color:var(--cs-text)]"
                                >
                                    Log out
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="hidden md:block">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-[color:var(--cs-text)] hover:bg-white/5"
                                        data-testid="header-login-button"
                                    >
                                        Log in
                                    </Button>
                                </Link>
                                <Link to="/register" className="hidden md:block">
                                    <Button
                                        size="sm"
                                        className="bg-[color:var(--cs-gold)] text-[color:var(--cs-bg)] hover:bg-[color:var(--cs-gold-2)] font-medium"
                                        data-testid="header-register-button"
                                    >
                                        Create account
                                    </Button>
                                </Link>
                            </>
                        )}
                        <button
                            type="button"
                            className="md:hidden p-2 rounded-md border border-[color:var(--cs-border)] text-[color:var(--cs-text)]"
                            onClick={() => setOpen((o) => !o)}
                            data-testid="header-mobile-menu-button"
                            aria-label="Toggle menu"
                        >
                            {open ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="md:hidden border-t border-[color:var(--cs-border)]"
                        style={{ backgroundColor: 'var(--cs-bg)' }}
                    >
                        <div className="px-4 py-4 flex flex-col gap-1" data-testid="header-mobile-menu">
                            {user ? <AuthedLinks /> : <PublicLinks />}
                            <div className="h-px my-2 bg-[color:var(--cs-border)]" />
                            {user ? (
                                <>
                                    <Link to="/profile" className={linkClass({ isActive: false })}>Profile</Link>
                                    <button
                                        onClick={logout}
                                        className={linkClass({ isActive: false }) + ' text-left'}
                                        data-testid="header-mobile-logout"
                                    >
                                        Log out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className={linkClass({ isActive: false })}>Log in</Link>
                                    <Link to="/register" className={linkClass({ isActive: false })}>Create account</Link>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default SiteHeader;
