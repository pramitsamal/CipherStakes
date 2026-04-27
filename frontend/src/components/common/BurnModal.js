import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Coins, Lock } from 'lucide-react';

const BurnModal = ({
    open,
    onOpenChange,
    quantity,
    entryCost,
    balance,
    drawTitle,
    onConfirm,
    loading,
}) => {
    const total = Math.max(0, quantity) * entryCost;
    const remaining = (balance ?? 0) - total;
    const insufficient = remaining < 0;

    const handleConfirm = async () => {
        if (insufficient || loading) return;
        await onConfirm();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                data-testid="burn-modal"
                className="sm:max-w-md border"
                style={{
                    backgroundColor: 'var(--cs-surface)',
                    borderColor: 'var(--cs-border)',
                    color: 'var(--cs-text)',
                }}
            >
                <DialogHeader>
                    <DialogTitle className="text-xl" style={{ color: 'var(--cs-text)' }}>
                        Confirm your entry
                    </DialogTitle>
                    <DialogDescription style={{ color: 'var(--cs-text-muted)' }}>
                        {drawTitle} — you’re about to burn Cipher Coins to lock in your entry.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 mt-2">
                    <Row label="Entries" value={`× ${quantity}`} testid="burn-row-entries" />
                    <Row
                        label="Cost per entry"
                        value={
                            <span className="inline-flex items-center gap-1 tabular-nums">
                                <Coins size={12} style={{ color: 'var(--cs-gold)' }} />
                                {entryCost}
                            </span>
                        }
                        testid="burn-row-cost"
                    />
                    <Separator style={{ backgroundColor: 'var(--cs-border)' }} />
                    <Row
                        label="Total burn"
                        value={
                            <span
                                className="cs-display text-2xl tabular-nums"
                                style={{ color: 'var(--cs-gold)' }}
                                data-testid="burn-total"
                            >
                                {total} Coins
                            </span>
                        }
                    />
                    <Row
                        label="Balance after"
                        value={
                            <span
                                className={`tabular-nums ${
                                    insufficient ? 'text-red-400' : 'text-[color:var(--cs-text)]'
                                }`}
                                data-testid="burn-balance-after"
                            >
                                {insufficient ? '--' : `${remaining} Coins`}
                            </span>
                        }
                    />
                    {insufficient && (
                        <div
                            className="text-xs rounded-md px-3 py-2 border"
                            style={{
                                borderColor: 'rgba(239,68,68,0.35)',
                                backgroundColor: 'rgba(239,68,68,0.08)',
                                color: '#FCA5A5',
                            }}
                            data-testid="burn-insufficient-warning"
                        >
                            You don’t have enough Cipher Coins. Claim your daily reward or purchase a pack.
                        </div>
                    )}
                    <p
                        className="text-[11px]"
                        style={{ color: 'var(--cs-text-muted)' }}
                    >
                        Cipher Gold has no prize value. Cipher Coins earned or purchased are used to enter sweepstakes draws.
                    </p>
                </div>
                <DialogFooter className="mt-4 gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        data-testid="burn-cancel-button"
                        className="text-[color:var(--cs-text-muted)] hover:text-[color:var(--cs-text)]"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={insufficient || loading}
                        data-testid="burn-confirm-button"
                        className="gap-2"
                        style={{
                            backgroundColor: 'var(--cs-gold)',
                            color: 'var(--cs-bg)',
                        }}
                    >
                        <Lock size={14} />
                        {loading ? 'Locking in…' : 'Lock in entry'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const Row = ({ label, value, testid }) => (
    <div
        className="flex items-center justify-between text-sm"
        data-testid={testid}
    >
        <span style={{ color: 'var(--cs-text-muted)' }}>{label}</span>
        <span style={{ color: 'var(--cs-text)' }}>{value}</span>
    </div>
);

export default BurnModal;
