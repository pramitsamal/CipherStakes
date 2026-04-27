import React from 'react';
import { motion } from 'framer-motion';

const Wordmark = ({ size = 'md' }) => {
    const text = size === 'lg' ? 'text-3xl' : 'text-xl';
    return (
        <div className="flex items-center gap-2" data-testid="brand-wordmark">
            <motion.span
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                aria-hidden
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border"
                style={{
                    borderColor: 'rgba(201,168,76,0.35)',
                    background:
                        'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(108,63,197,0.12))',
                }}
            >
                <span
                    className="cs-display text-base"
                    style={{ color: 'var(--cs-gold)' }}
                >
                    C
                </span>
            </motion.span>
            <span
                className={`cs-display ${text} leading-none`}
                style={{ color: 'var(--cs-gold)' }}
            >
                CipherStakes
            </span>
        </div>
    );
};

export default Wordmark;
