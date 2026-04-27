import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const GlobalLoadingContext = createContext(null);

/**
 * UI component responsible for rendering global loading provider.
 */
export function GlobalLoadingProvider({ children }) {
    const [loadingByKey, setLoadingByKey] = useState({});

    const setLoading = useCallback((key, value) => {
        setLoadingByKey((prev) => {
            if (!key) return prev;
            if (!value) {
                if (!(key in prev)) return prev;
                const next = { ...prev };
                delete next[key];
                return next;
            }
            if (prev[key] === true) return prev;
            return { ...prev, [key]: true };
        });
    }, []);

    const startLoading = useCallback((key = 'global') => {
        setLoading(key, true);
    }, [setLoading]);

    const stopLoading = useCallback((key = 'global') => {
        setLoading(key, false);
    }, [setLoading]);

    const isLoading = useMemo(
        () => Object.keys(loadingByKey).length > 0,
        [loadingByKey]
    );

    const value = useMemo(() => ({
        isLoading,
        loadingByKey,
        setLoading,
        startLoading,
        stopLoading,
    }), [isLoading, loadingByKey, setLoading, startLoading, stopLoading]);

    return (
        <GlobalLoadingContext.Provider value={value}>
            {children}
        </GlobalLoadingContext.Provider>
    );
}

/**
 * Custom hook that manages global loading.
 */
export function useGlobalLoading() {
    const context = useContext(GlobalLoadingContext);

    if (!context) {
        throw new Error('useGlobalLoading doit être utilisé dans GlobalLoadingProvider');
    }

    return context;
}
