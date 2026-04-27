import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { StatsProvider } from '../components/provider/StatsProvider';
import { ServiceProvider } from '../components/provider/ServiceProvider';

/**
 * UI component responsible for rendering provider screen.
 */
export function ProviderScreen() {
    const location = useLocation();
    const navigate = useNavigate();
    const { providerShowStats, setProviderShowStats } = useOutletContext();
    const mode = location.state?.mode || "defaultMode";
    const data = location.state?.data || [];
    const [showStats, setShowStats] = useState(false)

    useEffect(() => {
        if (location.state?.showStats) {
            setShowStats(true)
            setProviderShowStats(true)
            navigate(location.pathname, { replace: true, state: { ...location.state, showStats: false } })
        }
    }, [location.key, location.pathname, location.state?.showStats, navigate, setProviderShowStats])

    useEffect(() => {
        setProviderShowStats(showStats)
    }, [showStats, setProviderShowStats])

    return (
        <main className="flex-1 flex flex-col xl:flex-row h-screen md:overflow-hidden relative">
            <div className="flex-1 h-full md:overflow-y-auto py-4 md:p-2 md:pr-4 no-scrollbar">
                <div className="mx-auto pb-4 md:pb-0">
                    <ServiceProvider mode={mode} dataConsult={data} />
                </div>
            </div>
            {showStats && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm  xl:hidden  z-3"
                    onClick={() => setShowStats(false)}
                />
            )}
            {mode != "consultationCustomers" && (
                < StatsProvider showStats={showStats} setHideStats={() => setShowStats(false)} setShowStats={() => setShowStats(true)} />
            )}
            <ToastContainer position="bottom-center" />
        </main>
    )
}
