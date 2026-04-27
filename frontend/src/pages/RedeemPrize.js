import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Truck,
    Wallet,
    TrendingUp,
    CheckCircle2,
    Copy,
    ArrowLeft,
    ShieldCheck,
    Clock,
    Star,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const DRAW_ID = 'T3_BIWEEKLY_RIDE';

const formatCurrency = (n, fractionDigits = 0) =>
    Number(n || 0).toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: fractionDigits,
    });

const truncateHash = (h) =>
    h && h.length > 14 ? `${h.slice(0, 7)}…${h.slice(-5)}` : h;

const RedeemPrize = () => {
    const { claim_id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [draw, setDraw] = useState(null);
    const [redemption, setRedemption] = useState(null);
    const [choice, setChoice] = useState(null); // 'delivery' | 'liquidate' | 'yield'
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    const loadState = useCallback(async () => {
        try {
            const [drawRes, redeemRes] = await Promise.all([
                api.get(`/draws/${DRAW_ID}`),
                api.get(`/draws/redeem/status/${claim_id}`),
            ]);
            setDraw(drawRes.data);
            if (redeemRes.data?.redeemed) {
                setRedemption(redeemRes.data.redemption);
                setResult(redeemRes.data.redemption);
            }
        } catch (err) {
            toast.error('Could not load redemption state');
        } finally {
            setLoading(false);
        }
    }, [claim_id]);

    useEffect(() => {
        loadState();
    }, [loadState]);

    const redeem = async (payload) => {
        setSubmitting(true);
        try {
            const res = await api.post(`/draws/${DRAW_ID}/redeem`, payload);
            setResult(res.data);
            setRedemption(res.data);
            toast.success('Prize redemption confirmed');
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Redemption failed';
            toast.error(typeof msg === 'string' ? msg : 'Redemption failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div
                className="min-h-[60vh] flex items-center justify-center"
                style={{ color: 'var(--cs-text-muted)' }}
                data-testid="redeem-page-loading"
            >
                Loading your prize claim…
            </div>
        );
    }

    if (!draw || !user) {
        return null;
    }

    const prizeValue = draw.prize_value_usd || 35000;
    const liquidationAmount = Math.round(prizeValue * 0.7);

    // If already redeemed, just show the confirmation pane for the stored type.
    if (result || redemption) {
        const r = result || redemption;
        return (
            <div
                data-testid="redeem-page"
                className="cs-grid-bg min-h-[calc(100vh-64px)]"
            >
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-2 text-sm mb-6"
                        style={{ color: 'var(--cs-text-muted)' }}
                        data-testid="redeem-back-to-dashboard"
                    >
                        <ArrowLeft size={14} /> Back to dashboard
                    </button>
                    <RedemptionResult result={r} prizeValue={prizeValue} />
                </div>
            </div>
        );
    }

    return (
        <div data-testid="redeem-page" className="cs-grid-bg min-h-[calc(100vh-64px)]">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center gap-2 text-sm mb-6"
                    style={{ color: 'var(--cs-text-muted)' }}
                    data-testid="redeem-back-to-dashboard"
                >
                    <ArrowLeft size={14} /> Back to dashboard
                </button>

                <div className="mb-8">
                    <Badge
                        className="border"
                        style={{
                            borderColor: 'rgba(34,197,94,0.35)',
                            backgroundColor: 'rgba(34,197,94,0.08)',
                            color: 'var(--cs-success)',
                        }}
                        data-testid="redeem-winner-badge"
                    >
                        Winner confirmed
                    </Badge>
                    <h1
                        className="cs-display text-4xl sm:text-5xl mt-3"
                        style={{ color: 'var(--cs-text)' }}
                        data-testid="redeem-title"
                    >
                        You won the {draw.title}.
                    </h1>
                    <p
                        className="mt-3 text-base max-w-3xl"
                        style={{ color: 'var(--cs-text-muted)' }}
                    >
                        Your prize: <span style={{ color: 'var(--cs-text)' }}>{draw.prize_label}</span>.
                        Choose how you want to redeem. All options are verified by the
                        CipherStakes compliance team.
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {!choice && (
                        <motion.div
                            key="choice"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.35 }}
                            className="grid gap-5 md:grid-cols-3"
                            data-testid="redeem-choice-grid"
                        >
                            <OptionCard
                                onClick={() => setChoice('delivery')}
                                icon={<Truck size={20} />}
                                title="Take Delivery"
                                description="Receive your Kawasaki Ninja ZX-10R delivered to your door within 72 business hours of KYC verification."
                                cta="Choose Delivery"
                                testid="redeem-choice-delivery"
                            />
                            <OptionCard
                                onClick={() => setChoice('liquidate')}
                                icon={<Wallet size={20} />}
                                title="Liquidate for USDC"
                                description={`Receive ${formatCurrency(liquidationAmount)} USDC (70% of ${formatCurrency(prizeValue)} verified market value) within 7 business days.`}
                                subtext="Liquidation is processed at 70% of verified market value"
                                cta="Choose Liquidation"
                                testid="redeem-choice-liquidate"
                            />
                            <OptionCard
                                onClick={() => setChoice('yield')}
                                recommended
                                icon={<TrendingUp size={20} />}
                                title="Earn Monthly"
                                headline="$1,500–$1,750/mo"
                                description="Join the CipherStakes fleet. Your bike earns while you relax. $250/day × 10 rental days, 70% to you, paid in USDC on the 1st."
                                cta="Choose Fleet Yield"
                                testid="redeem-choice-yield"
                            />
                        </motion.div>
                    )}

                    {choice === 'delivery' && (
                        <DeliveryForm
                            key="delivery"
                            onBack={() => setChoice(null)}
                            onSubmit={(delivery_details) =>
                                redeem({
                                    winner_claim_id: claim_id,
                                    redemption_type: 'delivery',
                                    delivery_details,
                                })
                            }
                            submitting={submitting}
                        />
                    )}
                    {choice === 'liquidate' && (
                        <LiquidationAgreement
                            key="liquidate"
                            prizeValue={prizeValue}
                            liquidationAmount={liquidationAmount}
                            onBack={() => setChoice(null)}
                            onConfirm={() =>
                                redeem({
                                    winner_claim_id: claim_id,
                                    redemption_type: 'liquidate',
                                    liquidation_acknowledged: true,
                                })
                            }
                            submitting={submitting}
                        />
                    )}
                    {choice === 'yield' && (
                        <YieldAgreement
                            key="yield"
                            onBack={() => setChoice(null)}
                            onConfirm={() =>
                                redeem({
                                    winner_claim_id: claim_id,
                                    redemption_type: 'yield',
                                    yield_agreement_signed: true,
                                })
                            }
                            submitting={submitting}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// ---------- Option card ----------
const OptionCard = ({
    onClick,
    icon,
    title,
    description,
    headline,
    subtext,
    cta,
    recommended,
    testid,
}) => (
    <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.995 }}
        transition={{ duration: 0.18 }}
        className={`relative text-left rounded-2xl border p-6 cursor-pointer transition-colors duration-200 ${
            recommended
                ? 'border-[rgba(201,168,76,0.45)]'
                : 'border-[color:var(--cs-border)]'
        } hover:border-[rgba(201,168,76,0.45)] hover:shadow-[var(--cs-glow-gold)]`}
        style={{
            backgroundColor: 'var(--cs-surface)',
            boxShadow: recommended
                ? '0 18px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,168,76,0.2)'
                : 'var(--cs-shadow)',
        }}
        data-testid={testid}
    >
        {recommended && (
            <Badge
                className="absolute -top-3 left-5 border gap-1"
                style={{
                    backgroundColor: 'var(--cs-bg)',
                    borderColor: 'rgba(201,168,76,0.45)',
                    color: 'var(--cs-gold)',
                }}
                data-testid="redeem-recommended-badge"
            >
                <Star size={10} /> RECOMMENDED
            </Badge>
        )}
        <div
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg"
            style={{
                backgroundColor: 'rgba(201,168,76,0.08)',
                color: 'var(--cs-gold)',
                border: '1px solid rgba(201,168,76,0.25)',
            }}
        >
            {icon}
        </div>
        <div className="mt-4 cs-display text-2xl" style={{ color: 'var(--cs-text)' }}>
            {title}
        </div>
        {headline && (
            <div
                className="cs-display text-4xl mt-2 tabular-nums"
                style={{ color: 'var(--cs-gold)' }}
            >
                {headline}
            </div>
        )}
        <p
            className="mt-3 text-sm"
            style={{ color: 'var(--cs-text-muted)' }}
        >
            {description}
        </p>
        {subtext && (
            <p
                className="mt-2 text-[11px]"
                style={{ color: 'var(--cs-text-muted)' }}
            >
                {subtext}
            </p>
        )}
        <div
            className="mt-5 inline-flex items-center gap-2 text-sm"
            style={{ color: 'var(--cs-gold)' }}
        >
            {cta}
            <span aria-hidden>→</span>
        </div>
    </motion.button>
);

// ---------- Delivery form ----------
const DeliveryForm = ({ onBack, onSubmit, submitting }) => {
    const [form, setForm] = useState({
        full_name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        country: '',
        postal_code: '',
        phone: '',
        id_number: '',
    });
    const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const handleSubmit = (e) => {
        e.preventDefault();
        const required = [
            'full_name',
            'address_line1',
            'city',
            'country',
            'postal_code',
            'phone',
            'id_number',
        ];
        for (const k of required) {
            if (!form[k]) {
                toast.error(`${k.replace('_', ' ')} is required`);
                return;
            }
        }
        onSubmit(form);
    };
    return (
        <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="rounded-2xl border p-6 sm:p-8"
            style={{
                backgroundColor: 'var(--cs-surface)',
                borderColor: 'var(--cs-border)',
            }}
            data-testid="redeem-delivery-form"
        >
            <BackRow onBack={onBack} label="Change choice" />
            <div className="mt-3">
                <div
                    className="text-xs uppercase tracking-widest"
                    style={{ color: 'var(--cs-gold)' }}
                >
                    Take Delivery · Step 2 of 2
                </div>
                <h2 className="cs-display text-3xl mt-1" style={{ color: 'var(--cs-text)' }}>
                    Where should we deliver your prize?
                </h2>
            </div>

            <div className="grid gap-4 mt-6 sm:grid-cols-2">
                <Field id="full_name" label="Full legal name *" value={form.full_name} onChange={(v) => handleChange('full_name', v)} testid="delivery-full-name" />
                <Field id="phone" label="Phone number *" value={form.phone} onChange={(v) => handleChange('phone', v)} testid="delivery-phone" />
                <div className="sm:col-span-2">
                    <Field id="address_line1" label="Address line 1 *" value={form.address_line1} onChange={(v) => handleChange('address_line1', v)} testid="delivery-address1" />
                </div>
                <div className="sm:col-span-2">
                    <Field id="address_line2" label="Address line 2" value={form.address_line2} onChange={(v) => handleChange('address_line2', v)} testid="delivery-address2" />
                </div>
                <Field id="city" label="City *" value={form.city} onChange={(v) => handleChange('city', v)} testid="delivery-city" />
                <div>
                    <Label htmlFor="country" className="text-xs" style={{ color: 'var(--cs-text-muted)' }}>
                        Country *
                    </Label>
                    <select
                        id="country"
                        value={form.country}
                        onChange={(e) => handleChange('country', e.target.value)}
                        className="mt-1 w-full h-10 rounded-md px-3 border"
                        style={{
                            backgroundColor: 'var(--cs-surface-2)',
                            borderColor: 'var(--cs-border)',
                            color: 'var(--cs-text)',
                        }}
                        data-testid="delivery-country"
                    >
                        <option value="">Select country…</option>
                        <option>Nigeria</option>
                        <option>South Africa</option>
                        <option>Kenya</option>
                        <option>Philippines</option>
                        <option>United States</option>
                        <option>United Kingdom</option>
                        <option>India</option>
                        <option>Canada</option>
                        <option>Germany</option>
                        <option>United Arab Emirates</option>
                        <option>Other</option>
                    </select>
                </div>
                <Field id="postal_code" label="Postal code *" value={form.postal_code} onChange={(v) => handleChange('postal_code', v)} testid="delivery-postal" />
                <div className="sm:col-span-2">
                    <Field
                        id="id_number"
                        label="Government ID # (verification team will contact you) *"
                        value={form.id_number}
                        onChange={(v) => handleChange('id_number', v)}
                        testid="delivery-id-number"
                    />
                </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
                <Button
                    type="submit"
                    disabled={submitting}
                    className="h-11 font-medium"
                    style={{
                        backgroundColor: 'var(--cs-gold)',
                        color: 'var(--cs-bg)',
                    }}
                    data-testid="delivery-confirm-button"
                >
                    {submitting ? 'Confirming…' : 'Confirm Delivery'}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onBack}
                    className="h-11 border"
                    style={{ borderColor: 'var(--cs-border)', color: 'var(--cs-text)' }}
                >
                    Cancel
                </Button>
            </div>
        </motion.form>
    );
};

// ---------- Liquidation agreement ----------
const LiquidationAgreement = ({
    prizeValue,
    liquidationAmount,
    onBack,
    onConfirm,
    submitting,
}) => {
    const [acknowledged, setAcknowledged] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border p-6 sm:p-8"
            style={{
                backgroundColor: 'var(--cs-surface)',
                borderColor: 'rgba(201,168,76,0.35)',
                boxShadow: '0 18px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,168,76,0.15)',
            }}
            data-testid="redeem-liquidation-agreement"
        >
            <BackRow onBack={onBack} label="Change choice" />
            <div
                className="text-xs uppercase tracking-widest mt-3"
                style={{ color: 'var(--cs-gold)' }}
            >
                Liquidation Agreement
            </div>
            <h2 className="cs-display text-3xl mt-1" style={{ color: 'var(--cs-text)' }}>
                Convert your prize to USDC.
            </h2>

            <div
                className="mt-6 rounded-xl border p-5 space-y-3 text-sm"
                style={{
                    backgroundColor: 'var(--cs-surface-2)',
                    borderColor: 'var(--cs-border)',
                }}
            >
                <AgreementRow label="Prize" value="2026 Kawasaki Ninja ZX-10R" />
                <AgreementRow label="Verified Market Value" value={formatCurrency(prizeValue)} />
                <AgreementRow label="Liquidation Rate" value="70%" />
                <Separator style={{ backgroundColor: 'var(--cs-border)' }} />
                <AgreementRow
                    label="You Receive"
                    value={
                        <span
                            className="cs-display text-2xl"
                            style={{ color: 'var(--cs-gold)' }}
                            data-testid="redeem-liquidation-amount"
                        >
                            {formatCurrency(liquidationAmount)} USDC
                        </span>
                    }
                />
                <Separator style={{ backgroundColor: 'var(--cs-border)' }} />
                <AgreementRow label="Payment Timeline" value="Within 7 business days of agreement execution" />
                <AgreementRow label="Payment Method" value="USDC to your registered wallet or bank" />
            </div>

            <p
                className="mt-4 text-xs"
                style={{ color: 'var(--cs-text-muted)' }}
            >
                By confirming, you agree to transfer all rights to the above prize asset to
                CipherStakes in exchange for the USDC amount stated above.
            </p>

            <label
                className="mt-5 flex items-start gap-3 text-sm"
                style={{ color: 'var(--cs-text)' }}
                data-testid="redeem-liquidation-ack-row"
            >
                <Checkbox
                    id="liq-ack"
                    checked={acknowledged}
                    onCheckedChange={(v) => setAcknowledged(Boolean(v))}
                    className="mt-1"
                    data-testid="redeem-liquidation-ack"
                />
                <span>
                    I understand I am liquidating at 70% of market value and this cannot be
                    reversed.
                </span>
            </label>

            <div className="mt-6 flex flex-wrap gap-3">
                <Button
                    type="button"
                    onClick={onConfirm}
                    disabled={!acknowledged || submitting}
                    className="h-11 font-medium"
                    style={{
                        backgroundColor: 'var(--cs-gold)',
                        color: 'var(--cs-bg)',
                    }}
                    data-testid="redeem-liquidation-confirm"
                >
                    {submitting ? 'Confirming…' : 'Confirm Liquidation'}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onBack}
                    className="h-11 border"
                    style={{ borderColor: 'var(--cs-border)', color: 'var(--cs-text)' }}
                >
                    Cancel
                </Button>
            </div>
        </motion.div>
    );
};

// ---------- Yield agreement ----------
const YieldAgreement = ({ onBack, onConfirm, submitting }) => {
    const [signed, setSigned] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border p-6 sm:p-8"
            style={{
                backgroundColor: 'var(--cs-surface)',
                borderColor: 'rgba(201,168,76,0.45)',
                boxShadow: '0 18px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,168,76,0.18)',
            }}
            data-testid="redeem-yield-agreement"
        >
            <BackRow onBack={onBack} label="Change choice" />
            <div
                className="text-xs uppercase tracking-widest mt-3"
                style={{ color: 'var(--cs-gold)' }}
            >
                Fleet Yield Agreement
            </div>
            <h2 className="cs-display text-3xl mt-1" style={{ color: 'var(--cs-text)' }}>
                Let your bike earn for you.
            </h2>

            <div
                className="mt-6 grid gap-4 sm:grid-cols-2 rounded-xl border p-5"
                style={{
                    backgroundColor: 'var(--cs-surface-2)',
                    borderColor: 'var(--cs-border)',
                }}
            >
                <AgreementRow label="Asset" value="2026 Kawasaki Ninja ZX-10R ($35,000)" />
                <AgreementRow label="Daily Rental Rate" value="$250 / day" />
                <AgreementRow label="Estimated Rental Days" value="10 days / month" />
                <AgreementRow label="Monthly Gross Revenue" value="$2,500" />
                <AgreementRow
                    label="Your Share (70%)"
                    value={
                        <span
                            className="cs-display text-xl"
                            style={{ color: 'var(--cs-gold)' }}
                            data-testid="redeem-yield-your-share"
                        >
                            $1,750 / month
                        </span>
                    }
                />
                <AgreementRow label="CipherStakes Share (30%)" value="$750 / month" />
                <Separator className="sm:col-span-2" style={{ backgroundColor: 'var(--cs-border)' }} />
                <AgreementRow label="Estimated Monthly Earnings" value="$1,500 – $1,750 USDC" />
                <AgreementRow label="Payout Date" value="1st of each month" />
                <AgreementRow label="Minimum Term" value="12 months" />
                <AgreementRow label="Insurance" value="Fully covered by CipherStakes" />
            </div>

            <label
                className="mt-5 flex items-start gap-3 text-sm"
                style={{ color: 'var(--cs-text)' }}
                data-testid="redeem-yield-sign-row"
            >
                <Checkbox
                    id="yield-sign"
                    checked={signed}
                    onCheckedChange={(v) => setSigned(Boolean(v))}
                    className="mt-1"
                    data-testid="redeem-yield-sign"
                />
                <span>
                    I agree to the Fleet Yield terms and authorise CipherStakes to manage and
                    rent this asset on my behalf.
                </span>
            </label>

            <div className="mt-6 flex flex-wrap gap-3">
                <Button
                    type="button"
                    onClick={onConfirm}
                    disabled={!signed || submitting}
                    className="h-11 font-medium gap-2"
                    style={{
                        backgroundColor: 'var(--cs-gold)',
                        color: 'var(--cs-bg)',
                    }}
                    data-testid="redeem-yield-confirm"
                >
                    <ShieldCheck size={14} />
                    {submitting ? 'Activating…' : 'Sign Agreement & Activate Yield'}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onBack}
                    className="h-11 border"
                    style={{ borderColor: 'var(--cs-border)', color: 'var(--cs-text)' }}
                >
                    Cancel
                </Button>
            </div>
        </motion.div>
    );
};

// ---------- Result screens ----------
const RedemptionResult = ({ result, prizeValue }) => {
    if (result.status === 'DELIVERY_PENDING' || result.redemption_type === 'delivery') {
        return <DeliveryResult result={result} />;
    }
    if (result.status === 'LIQUIDATION_PENDING' || result.redemption_type === 'liquidate') {
        return <LiquidationResult result={result} prizeValue={prizeValue} />;
    }
    if (result.status === 'YIELD_ACTIVE' || result.redemption_type === 'yield') {
        return <YieldResult result={result} />;
    }
    return null;
};

const DeliveryResult = ({ result }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border p-6 sm:p-8"
        style={{
            backgroundColor: 'var(--cs-surface)',
            borderColor: 'rgba(201,168,76,0.35)',
        }}
        data-testid="redeem-result-delivery"
    >
        <div className="flex items-start gap-3">
            <CheckCircle2 size={32} style={{ color: 'var(--cs-success)' }} />
            <div>
                <div
                    className="text-xs uppercase tracking-widest"
                    style={{ color: 'var(--cs-success)' }}
                >
                    Delivery requested
                </div>
                <h2 className="cs-display text-3xl mt-1" style={{ color: 'var(--cs-text)' }}>
                    Your bike is on the way.
                </h2>
            </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <ResultRow
                label="Tracking ID"
                value={<span className="cs-mono">{result.tracking_id}</span>}
                testid="redeem-delivery-tracking-id"
            />
            <ResultRow
                label="Estimated dispatch"
                value={result.estimated_dispatch || '72 business hours'}
            />
        </div>
        <div className="mt-8">
            <div
                className="text-xs uppercase tracking-widest"
                style={{ color: 'var(--cs-text-muted)' }}
            >
                Prize journey
            </div>
            <JourneyTracker
                steps={[
                    { label: 'Winner Confirmed', state: 'done' },
                    { label: 'KYC Verified', state: 'active' },
                    { label: 'Dispatch Initiated', state: 'pending' },
                    { label: 'Delivered', state: 'pending' },
                ]}
            />
        </div>
        <p className="mt-8 text-sm" style={{ color: 'var(--cs-text-muted)' }}>
            Our concierge team will contact you within 24 hours to verify KYC and arrange
            logistics.
        </p>
    </motion.div>
);

const LiquidationResult = ({ result, prizeValue }) => {
    const amount = result.usdc_amount ?? Math.round((prizeValue || 35000) * 0.7);
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-6 sm:p-8"
            style={{
                backgroundColor: 'var(--cs-surface)',
                borderColor: 'rgba(201,168,76,0.35)',
            }}
            data-testid="redeem-result-liquidation"
        >
            <div className="flex items-start gap-3">
                <CheckCircle2 size={32} style={{ color: 'var(--cs-success)' }} />
                <div>
                    <div
                        className="text-xs uppercase tracking-widest"
                        style={{ color: 'var(--cs-success)' }}
                    >
                        Liquidation confirmed
                    </div>
                    <h2 className="cs-display text-3xl mt-1" style={{ color: 'var(--cs-text)' }}>
                        Your USDC is on the way.
                    </h2>
                </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <ResultRow
                    label="Reference"
                    value={<span className="cs-mono">{result.redemption_id || 'pending'}</span>}
                    testid="redeem-liquidation-reference"
                />
                <ResultRow
                    label="Amount"
                    value={
                        <span
                            className="cs-display text-2xl"
                            style={{ color: 'var(--cs-gold)' }}
                            data-testid="redeem-liquidation-result-amount"
                        >
                            {formatCurrency(amount)} USDC
                        </span>
                    }
                />
                <ResultRow label="Expected payment" value={result.estimated_payment || '7 business days'} />
                <ResultRow
                    label="Payment method"
                    value="USDC to registered wallet or bank"
                />
            </div>
        </motion.div>
    );
};

const YieldResult = ({ result }) => {
    const nextPayout = new Date();
    nextPayout.setMonth(nextPayout.getMonth() + 1);
    nextPayout.setDate(1);
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-6 sm:p-8 cs-sweep-gold relative"
            style={{
                backgroundColor: 'var(--cs-surface)',
                borderColor: 'rgba(201,168,76,0.45)',
                boxShadow: '0 18px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,168,76,0.2)',
            }}
            data-testid="redeem-result-yield"
        >
            <div className="flex items-start gap-3">
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="rounded-full p-2"
                    style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}
                >
                    <CheckCircle2 size={28} style={{ color: 'var(--cs-success)' }} />
                </motion.div>
                <div>
                    <div
                        className="text-xs uppercase tracking-widest"
                        style={{ color: 'var(--cs-success)' }}
                    >
                        Agreement activated
                    </div>
                    <h2 className="cs-display text-3xl mt-1" style={{ color: 'var(--cs-text)' }}>
                        Your Ninja ZX-10R is now earning.
                    </h2>
                </div>
            </div>

            {/* tx hash */}
            <div
                className="mt-6 rounded-xl border p-4"
                style={{
                    backgroundColor: 'var(--cs-surface-2)',
                    borderColor: 'var(--cs-border)',
                }}
            >
                <div
                    className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'var(--cs-text-muted)' }}
                >
                    On-Chain Agreement Hash (Simulated)
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <code
                        className="cs-mono text-sm px-2 py-1 rounded-md"
                        style={{
                            color: 'var(--cs-gold)',
                            backgroundColor: 'rgba(201,168,76,0.08)',
                            border: '1px solid rgba(201,168,76,0.25)',
                        }}
                        data-testid="redeem-yield-tx-hash-short"
                    >
                        {truncateHash(result.tx_hash)}
                    </code>
                    <button
                        type="button"
                        onClick={() => {
                            navigator.clipboard.writeText(result.tx_hash || '');
                            toast.success('Hash copied');
                        }}
                        className="p-1 rounded hover:bg-white/5"
                    >
                        <Copy size={13} style={{ color: 'var(--cs-gold)' }} />
                    </button>
                </div>
                <div
                    className="mt-2 cs-mono text-[11px] break-all"
                    style={{ color: 'var(--cs-text-muted)' }}
                    data-testid="redeem-yield-tx-hash-full"
                >
                    {result.tx_hash}
                </div>
            </div>

            {/* yield dashboard preview */}
            <div
                className="mt-6 rounded-xl border p-5"
                style={{
                    backgroundColor: 'var(--cs-surface-2)',
                    borderColor: 'rgba(201,168,76,0.25)',
                }}
                data-testid="redeem-yield-dashboard-preview"
            >
                <div
                    className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'var(--cs-gold)' }}
                >
                    Yield dashboard — preview
                </div>
                <div className="grid gap-4 mt-4 sm:grid-cols-3">
                    <DashMetric label="Asset" value="Kawasaki Ninja ZX-10R" />
                    <DashMetric
                        label="Status"
                        value={
                            <span style={{ color: 'var(--cs-success)' }}>Active</span>
                        }
                    />
                    <DashMetric
                        label="Next payout"
                        value={`1 ${nextPayout.toLocaleString(undefined, {
                            month: 'short',
                            year: 'numeric',
                        })}`}
                    />
                    <DashMetric
                        label="Estimated amount"
                        value={
                            <span
                                className="cs-display text-xl tabular-nums"
                                style={{ color: 'var(--cs-gold)' }}
                            >
                                $1,500 – $1,750 USDC
                            </span>
                        }
                    />
                    <DashMetric
                        label="Monthly breakdown"
                        value={"$250/day × 10 days × 70%"}
                    />
                    <DashMetric
                        label="Payout cadence"
                        value="1st of each month"
                    />
                </div>
            </div>

            <div
                className="mt-6 inline-flex items-center gap-2 text-xs"
                style={{ color: 'var(--cs-text-muted)' }}
            >
                <Clock size={12} /> Agreement executed just now. Insurance is fully covered by CipherStakes.
            </div>
        </motion.div>
    );
};

// ---------- Supporting atoms ----------
const BackRow = ({ onBack, label }) => (
    <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs"
        style={{ color: 'var(--cs-text-muted)' }}
        data-testid="redeem-step-back"
    >
        <ArrowLeft size={13} /> {label}
    </button>
);

const AgreementRow = ({ label, value }) => (
    <div className="flex items-center justify-between gap-4">
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--cs-text-muted)' }}>
            {label}
        </span>
        <span style={{ color: 'var(--cs-text)' }}>{value}</span>
    </div>
);

const ResultRow = ({ label, value, testid }) => (
    <div
        className="rounded-lg border p-3"
        style={{ borderColor: 'var(--cs-border)', backgroundColor: 'var(--cs-surface-2)' }}
        data-testid={testid}
    >
        <div
            className="text-[11px] uppercase tracking-widest"
            style={{ color: 'var(--cs-text-muted)' }}
        >
            {label}
        </div>
        <div className="mt-1" style={{ color: 'var(--cs-text)' }}>
            {value}
        </div>
    </div>
);

const DashMetric = ({ label, value }) => (
    <div>
        <div
            className="text-[10px] uppercase tracking-widest"
            style={{ color: 'var(--cs-text-muted)' }}
        >
            {label}
        </div>
        <div className="mt-1 text-sm" style={{ color: 'var(--cs-text)' }}>
            {value}
        </div>
    </div>
);

const JourneyTracker = ({ steps }) => (
    <div className="mt-4 grid grid-cols-4 gap-2" data-testid="redeem-journey-tracker">
        {steps.map((s, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
                <div
                    className="h-8 w-8 rounded-full flex items-center justify-center"
                    style={{
                        backgroundColor:
                            s.state === 'done'
                                ? 'rgba(34,197,94,0.15)'
                                : s.state === 'active'
                                  ? 'rgba(201,168,76,0.15)'
                                  : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${
                            s.state === 'done'
                                ? 'rgba(34,197,94,0.4)'
                                : s.state === 'active'
                                  ? 'rgba(201,168,76,0.5)'
                                  : 'var(--cs-border)'
                        }`,
                        color:
                            s.state === 'done'
                                ? 'var(--cs-success)'
                                : s.state === 'active'
                                  ? 'var(--cs-gold)'
                                  : 'var(--cs-text-muted)',
                    }}
                >
                    {s.state === 'done' ? <CheckCircle2 size={14} /> : idx + 1}
                </div>
                <div
                    className="mt-2 text-[11px] leading-tight"
                    style={{
                        color:
                            s.state === 'pending'
                                ? 'var(--cs-text-muted)'
                                : 'var(--cs-text)',
                    }}
                >
                    {s.label}
                </div>
            </div>
        ))}
    </div>
);

const Field = ({ id, label, value, onChange, testid }) => (
    <div>
        <Label htmlFor={id} className="text-xs" style={{ color: 'var(--cs-text-muted)' }}>
            {label}
        </Label>
        <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1"
            style={{
                backgroundColor: 'var(--cs-surface-2)',
                borderColor: 'var(--cs-border)',
                color: 'var(--cs-text)',
            }}
            data-testid={testid}
        />
    </div>
);

export default RedeemPrize;
