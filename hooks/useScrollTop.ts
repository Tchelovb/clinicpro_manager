import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to automatically scroll the App Shell main content to top on route change.
 * Can also be used to manually scroll to top.
 */
export const useScrollTop = () => {
    const { pathname } = useLocation();

    const scrollToTop = () => {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToTop();
    }, [pathname]);

    return { scrollToTop };
};
