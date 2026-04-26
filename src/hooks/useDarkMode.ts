import { useState, useEffect } from 'react';

export function useDarkMode() {
    // Forced to light mode as requested
    const isDark = false;

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }, []);

    const toggleDarkMode = () => {};

    return { isDark, toggleDarkMode };
}
