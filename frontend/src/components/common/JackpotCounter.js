import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import api from '@/lib/api';

const formatCurrency = (n) =>
    Number(n || 0).toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    });

const JackpotCounter = ({ drawId = 'T1_DAILY_FLASH', initial = 0, pollMs = 30000 }) => {
    const [value, setValue] = useState(initial || 0);
    const display = useMotionValue(initial || 0);
    const rounded = useTransform(display, (v) => formatCurrency(v));
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const controls = animate(display, value, {
            duration: 1.2,
            ease: [0.2, 0.8, 0.2, 1],
        });
        return () => controls.stop();
    }, [value, display]);

    useEffect(() => {
        let mounted = true;
        const fetchOnce = async () => {
            try {
                const res = await api.get(`/draws/${drawId}`);
                const next = Number(res.data?.jackpot_usdc ?? res.data?.prize_fixed_usdc ?? 0);
                if (mounted && !Number.isNaN(next)) setValue(next);
            } catch (_err) {
                /* silent */
            }
        };
        fetchOnce();
        const id = setInterval(fetchOnce, pollMs);
        return () => {
            mounted = false;
            clearInterval(id);
        };
    }, [drawId, pollMs]);

    return (
        <motion.div
            data-testid="jackpot-counter"
            className="relative inline-flex items-baseline"
            animate={{
                filter: [
                    'drop-shadow(0 0 0 rgba(201,168,76,0))',
                    'drop-shadow(0 0 22px rgba(201,168,76,0.24))',
                    'drop-shadow(0 0 0 rgba(201,168,76,0))',
                ],
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
            <motion.span
                className="cs-display text-5xl sm:text-6xl lg:text-7xl tabular-nums tracking-tight"
                style={{ color: 'var(--cs-gold)' }}
            >
                {rounded}
            </motion.span>
        </motion.div>
    );
};

export default JackpotCounter;
