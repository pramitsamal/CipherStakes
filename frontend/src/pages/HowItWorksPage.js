import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

const FAQS = [
    {
        q: 'Is CipherStakes gambling?',
        a: 'No. CipherStakes is legally structured as a sweepstakes using a two-currency model. Cipher Gold (purchased with real money) has no prize value. Cipher Coins — which are used to enter draws — can always be earned for free (Alternative Method of Entry, AMOE).',
    },
    {
        q: 'How are winners selected?',
        a: 'Each draw has a cycle (daily for T1, weekly for T2). At the scheduled time, a cryptographically secure random number generator (CSPRNG) selects one of the active entries. The winning entry ID is published publicly on the Results page.',
    },
    {
        q: 'What is an entry receipt?',
        a: 'When you enter a draw, we generate a UUID and a sha256 hash of (your user ID + draw ID + timestamp + secure nonce). This receipt is immutable and publicly verifiable once the winner is announced.',
    },
    {
        q: 'What countries are supported?',
        a: 'CipherStakes is initially available to players from Nigeria, South Africa, Kenya, Philippines, and the United States, subject to local eligibility. Void where prohibited.',
    },
    {
        q: 'What is KYC? Why do winners need it?',
        a: 'KYC (Know Your Customer) is required only before we release a prize. It verifies the identity of winners and ensures compliance with global financial regulations.',
    },
    {
        q: 'Will Chainlink VRF be integrated?',
        a: 'Yes. The MVP uses Python’s secrets module (CSPRNG) for randomness. Chainlink VRF integration is on the roadmap immediately after Campaign 1 to provide on-chain provable fairness.',
    },
];

const HowItWorksPage = () => (
    <div data-testid="how-it-works-page" className="cs-grid-bg">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14">
            <div
                className="text-xs uppercase tracking-widest"
                style={{ color: 'var(--cs-text-muted)' }}
            >
                The mechanics
            </div>
            <h1 className="cs-display text-4xl sm:text-5xl mt-2" style={{ color: 'var(--cs-text)' }}>
                How CipherStakes works.
            </h1>
            <p className="mt-4 text-sm" style={{ color: 'var(--cs-text-muted)' }}>
                A two-currency sweepstakes platform, built compliance-first. Every entry is receipt-backed,
                every winner is selected with cryptographically secure randomness, and every Coin can be
                earned without spending a dollar.
            </p>

            <div
                className="mt-10 rounded-2xl border p-6"
                style={{
                    backgroundColor: 'var(--cs-surface)',
                    borderColor: 'var(--cs-border)',
                }}
            >
                <Accordion type="single" collapsible className="w-full">
                    {FAQS.map((item, i) => (
                        <AccordionItem
                            key={i}
                            value={`item-${i}`}
                            className="border-b last:border-b-0"
                            style={{ borderColor: 'var(--cs-border)' }}
                            data-testid={`faq-item-${i}`}
                        >
                            <AccordionTrigger
                                className="text-left"
                                style={{ color: 'var(--cs-text)' }}
                            >
                                {item.q}
                            </AccordionTrigger>
                            <AccordionContent
                                style={{ color: 'var(--cs-text-muted)' }}
                            >
                                {item.a}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>

            <div
                className="mt-8 rounded-xl border p-4 text-xs"
                style={{
                    borderColor: 'var(--cs-border)',
                    backgroundColor: 'var(--cs-surface-2)',
                    color: 'var(--cs-text-muted)',
                }}
            >
                Compliance note: No purchase necessary. Void where prohibited. All randomness for the MVP
                uses Python’s secrets module (CSPRNG); a future release will integrate Chainlink VRF.
            </div>
        </div>
    </div>
);

export default HowItWorksPage;
