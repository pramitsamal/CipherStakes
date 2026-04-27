import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Copy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const truncate = (s, n = 14) =>
    s && s.length > n ? `${s.slice(0, n / 2)}…${s.slice(-n / 2)}` : s;

const copy = (text, label) => {
    try {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied`);
    } catch (_e) {
        toast.error('Copy failed');
    }
};

const EntryReceipt = ({ entries, drawTitle, jackpotAfter }) => {
    const first = entries[0];
    const timestamp = first?.timestamp ? new Date(first.timestamp).toUTCString() : '';
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative rounded-2xl border cs-sweep-gold"
            style={{
                backgroundColor: 'var(--cs-surface)',
                borderColor: 'rgba(201,168,76,0.4)',
                boxShadow: 'var(--cs-glow-gold)',
            }}
            data-testid="entry-receipt-card"
        >
            <div className="p-6">
                <div className="flex items-start gap-3">
                    <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        className="rounded-full p-2"
                        style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}
                    >
                        <CheckCircle2
                            size={28}
                            style={{ color: 'var(--cs-success)' }}
                        />
                    </motion.div>
                    <div>
                        <div
                            className="text-sm uppercase tracking-widest"
                            style={{ color: 'var(--cs-success)' }}
                        >
                            Entry locked in
                        </div>
                        <h3
                            className="cs-display text-2xl sm:text-3xl mt-1"
                            style={{ color: 'var(--cs-text)' }}
                        >
                            {entries.length} × {drawTitle}
                        </h3>
                    </div>
                </div>

                <div className="mt-5 space-y-3">
                    <ReceiptRow
                        label="Entry ID"
                        value={first?.entry_id}
                        onCopy={() => copy(first?.entry_id, 'Entry ID')}
                        testid="entry-receipt-entry-id"
                        copyTestid="entry-receipt-copy-entry-id-button"
                    />
                    <ReceiptRow
                        label="Receipt hash (sha256)"
                        value={first?.entry_hash}
                        mono
                        truncateChars={18}
                        onCopy={() => copy(first?.entry_hash, 'Receipt hash')}
                        testid="entry-receipt-hash"
                        copyTestid="entry-receipt-copy-hash-button"
                    />
                    <ReceiptRow label="Timestamp (UTC)" value={timestamp} testid="entry-receipt-timestamp" />
                    {jackpotAfter != null && (
                        <ReceiptRow
                            label="T1 jackpot after your burn"
                            value={`$${Number(jackpotAfter).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                            testid="entry-receipt-jackpot-after"
                        />
                    )}
                </div>

                {entries.length > 1 && (
                    <div className="mt-4">
                        <button
                            type="button"
                            className="text-xs underline"
                            style={{ color: 'var(--cs-text-muted)' }}
                            onClick={() => setExpanded((e) => !e)}
                            data-testid="entry-receipt-show-all-toggle"
                        >
                            {expanded ? 'Hide all entries' : `Show all ${entries.length} entries`}
                        </button>
                        {expanded && (
                            <div
                                className="mt-3 rounded-lg border text-xs"
                                style={{
                                    borderColor: 'var(--cs-border)',
                                    backgroundColor: 'var(--cs-surface-2)',
                                }}
                                data-testid="entry-receipt-all-list"
                            >
                                {entries.map((e) => (
                                    <div
                                        key={e.entry_id}
                                        className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
                                        style={{ borderColor: 'var(--cs-border)' }}
                                    >
                                        <span className="cs-mono" style={{ color: 'var(--cs-text-muted)' }}>
                                            {truncate(e.entry_id, 18)}
                                        </span>
                                        <button
                                            className="cs-gold hover:opacity-80"
                                            onClick={() => copy(e.entry_id, 'Entry ID')}
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                    <Link to="/dashboard">
                        <Button
                            className="gap-2"
                            style={{
                                backgroundColor: 'var(--cs-gold)',
                                color: 'var(--cs-bg)',
                            }}
                            data-testid="entry-receipt-cta-dashboard"
                        >
                            View my entries <ArrowRight size={14} />
                        </Button>
                    </Link>
                    <Link to="/results">
                        <Button
                            variant="ghost"
                            className="gap-2 border"
                            style={{
                                borderColor: 'var(--cs-border)',
                                color: 'var(--cs-text)',
                            }}
                            data-testid="entry-receipt-cta-results"
                        >
                            Results feed <ArrowRight size={14} />
                        </Button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

const ReceiptRow = ({
    label,
    value,
    mono,
    truncateChars = 22,
    onCopy,
    testid,
    copyTestid,
}) => (
    <div
        className="flex items-center justify-between gap-4 rounded-lg px-3 py-2 border"
        style={{
            borderColor: 'var(--cs-border)',
            backgroundColor: 'var(--cs-surface-2)',
        }}
    >
        <div className="flex flex-col">
            <span
                className="text-[11px] uppercase tracking-widest"
                style={{ color: 'var(--cs-text-muted)' }}
            >
                {label}
            </span>
            <span
                className={`${mono ? 'cs-mono' : ''} text-sm break-all`}
                style={{ color: 'var(--cs-text)' }}
                data-testid={testid}
            >
                {value ? truncate(String(value), truncateChars) : '—'}
            </span>
        </div>
        {onCopy && (
            <button
                type="button"
                className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
                onClick={onCopy}
                aria-label={`Copy ${label}`}
                data-testid={copyTestid}
            >
                <Copy size={14} style={{ color: 'var(--cs-gold)' }} />
            </button>
        )}
    </div>
);

export default EntryReceipt;
