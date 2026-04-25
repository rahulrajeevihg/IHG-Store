import { useState, useEffect } from 'react';

// Custom hook to detect screen size for "tab view"
const useTabView = () => {
    const [tabView, setTabView] = useState(false);

    // Function to check the screen size
    const checkScreenSize = () => {
        if (window.innerWidth >= 768 && window.innerWidth <= 1024) {
            setTabView(true); // Tab (mobile) screen size
        } else {
            setTabView(false); // Desktop or larger screen
        }
    };

    // Effect hook to check the screen size on mount and on window resize
    useEffect(() => {
        checkScreenSize();

        // Add event listener on resize
        window.addEventListener('resize', checkScreenSize);

        // Cleanup event listener on unmount
        return () => {
            window.removeEventListener('resize', checkScreenSize);
        };
    }, []); // Empty dependency array ensures it runs only on mount

    return tabView;
};

export default useTabView;
