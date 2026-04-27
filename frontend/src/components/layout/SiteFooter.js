import React from 'react';
import { Link } from 'react-router-dom';

const SiteFooter = () => {
    return (
        <footer
            data-testid="site-footer"
            className="border-t border-[color:var(--cs-border)] mt-20"
            style={{ backgroundColor: 'var(--cs-surface-2)' }}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8">
                    <div>
                        <div className="cs-display text-2xl" style={{ color: 'var(--cs-gold)' }}>
                            CipherStakes
                        </div>
                        <p className="mt-2 max-w-md text-sm" style={{ color: 'var(--cs-text-muted)' }}>
                            Provably fair luxury prize draws, legally structured as a
                            sweepstakes. Cipher Gold has no prize value — Cipher Coins
                            may be earned free and used for entries.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-8 sm:gap-12">
                        <div>
                            <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--cs-text-muted)' }}>
                                Product
                            </div>
                            <ul className="mt-3 space-y-2 text-sm">
                                <li><Link to="/draws" className="hover:text-white">Active draws</Link></li>
                                <li><Link to="/store" className="hover:text-white">Coin packs</Link></li>
                                <li><Link to="/results" className="hover:text-white">Results feed</Link></li>
                                <li><Link to="/how-it-works" className="hover:text-white">How it works</Link></li>
                            </ul>
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--cs-text-muted)' }}>
                                Compliance
                            </div>
                            <ul className="mt-3 space-y-2 text-sm">
                                <li>No purchase necessary to play</li>
                                <li>Void where prohibited</li>
                                <li>KYC required before prize release</li>
                                <li>Available in NG, ZA, KE, PH, US</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div
                    className="mt-10 pt-6 border-t border-[color:var(--cs-border)] text-xs"
                    style={{ color: 'var(--cs-text-muted)' }}
                >
                    © {new Date().getFullYear()} CipherStakes. All rights reserved.
                    Sweepstakes platform — not a gambling service.
                </div>
            </div>
        </footer>
    );
};

export default SiteFooter;
