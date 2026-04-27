import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import DrawCard from '@/components/common/DrawCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DrawsPage = () => {
    const [draws, setDraws] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('active');

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/draws');
                setDraws(res.data || []);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = draws.filter((d) => {
        if (tab === 'all') return true;
        return d.status === tab;
    });

    return (
        <div data-testid="draws-page" className="cs-grid-bg">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="cs-display text-4xl" style={{ color: 'var(--cs-text)' }}>
                        Active draws
                    </h1>
                    <p
                        className="mt-2 text-sm max-w-2xl"
                        style={{ color: 'var(--cs-text-muted)' }}
                    >
                        Daily and weekly sweepstakes with USDC payouts and upcoming physical prizes.
                    </p>
                </div>
                <Tabs value={tab} onValueChange={setTab} className="mb-6">
                    <TabsList
                        className="border"
                        style={{
                            backgroundColor: 'var(--cs-surface-2)',
                            borderColor: 'var(--cs-border)',
                        }}
                        data-testid="draws-tabs"
                    >
                        <TabsTrigger value="active" data-testid="draws-tab-active">
                            Active
                        </TabsTrigger>
                        <TabsTrigger value="upcoming" data-testid="draws-tab-upcoming">
                            Upcoming
                        </TabsTrigger>
                        <TabsTrigger value="all" data-testid="draws-tab-all">
                            All
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => (
                              <div
                                  key={i}
                                  className="rounded-2xl aspect-[3/4] border animate-pulse"
                                  style={{
                                      backgroundColor: 'var(--cs-surface)',
                                      borderColor: 'var(--cs-border)',
                                  }}
                              />
                          ))
                        : filtered.map((d) => (
                              <DrawCard
                                  key={d.draw_id}
                                  draw={d}
                                  featured={d.tier === 'T1'}
                              />
                          ))}
                </div>
                {!loading && filtered.length === 0 && (
                    <div
                        className="rounded-2xl border p-10 text-center"
                        style={{
                            backgroundColor: 'var(--cs-surface)',
                            borderColor: 'var(--cs-border)',
                            color: 'var(--cs-text-muted)',
                        }}
                        data-testid="draws-empty"
                    >
                        Nothing here right now. Check back soon.
                    </div>
                )}
            </div>
        </div>
    );
};

export default DrawsPage;
