import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import '@/App.css';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import PrivateRoute from '@/components/common/PrivateRoute';

import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import OAuthSuccessPage from '@/pages/OAuthSuccessPage';
import DashboardPage from '@/pages/DashboardPage';
import DrawsPage from '@/pages/DrawsPage';
import DrawDetailPage from '@/pages/DrawDetailPage';
import PackStorePage from '@/pages/PackStorePage';
import CheckoutStatusPage from '@/pages/CheckoutStatusPage';
import ResultsPage from '@/pages/ResultsPage';
import ProfilePage from '@/pages/ProfilePage';
import HowItWorksPage from '@/pages/HowItWorksPage';
import NotFoundPage from '@/pages/NotFoundPage';

const EnsureDarkMode = ({ children }) => {
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);
    return children;
};

const RouteScaffold = () => {
    const { loading } = useAuth();
    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ color: 'var(--cs-text-muted)' }}
            >
                Loading CipherStakes…
            </div>
        );
    }
    return (
        <div className="flex flex-col min-h-screen">
            <SiteHeader />
            <main className="flex-1">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/oauth/success" element={<OAuthSuccessPage />} />
                    <Route path="/draws" element={<DrawsPage />} />
                    <Route path="/draws/:drawId" element={<DrawDetailPage />} />
                    <Route path="/results" element={<ResultsPage />} />
                    <Route path="/how-it-works" element={<HowItWorksPage />} />
                    <Route path="/store" element={<PackStorePage />} />
                    <Route path="/checkout/status" element={<CheckoutStatusPage />} />
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <DashboardPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <PrivateRoute>
                                <ProfilePage />
                            </PrivateRoute>
                        }
                    />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </main>
            <SiteFooter />
        </div>
    );
};

function App() {
    return (
        <div className="App">
            <EnsureDarkMode>
                <AuthProvider>
                    <BrowserRouter>
                        <RouteScaffold />
                        <Toaster
                            theme="dark"
                            position="top-center"
                            toastOptions={{
                                style: {
                                    background: 'var(--cs-surface)',
                                    border: '1px solid var(--cs-border)',
                                    color: 'var(--cs-text)',
                                },
                            }}
                        />
                    </BrowserRouter>
                </AuthProvider>
            </EnsureDarkMode>
        </div>
    );
}

export default App;
