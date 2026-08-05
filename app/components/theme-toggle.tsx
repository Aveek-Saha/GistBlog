"use client";

export function ThemeToggle() {
    function toggleTheme() {
        const root = document.documentElement;
        const current = root.dataset.theme === "dark" ? "dark" : "light";
        const next = current === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        localStorage.setItem("gistblog-theme", next);
    }

    return (
        <button
            className="icon-button theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            title="Toggle color theme"
        >
            <svg
                className="theme-icon theme-icon-sun"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                aria-hidden="true"
            >
                <circle cx="9" cy="9" r="3.25" fill="none" stroke="currentColor" />
                <path
                    d="M9 1.5V3M9 15v1.5M1.5 9H3M15 9h1.5M3.7 3.7l1.05 1.05m8.5 8.5 1.05 1.05m0-10.6-1.05 1.05m-8.5 8.5L3.7 14.3"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="square"
                />
            </svg>
            <svg
                className="theme-icon theme-icon-moon"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                aria-hidden="true"
            >
                <path
                    d="M14.7 11.2A6.2 6.2 0 0 1 6.8 3.3 6.2 6.2 0 1 0 14.7 11.2Z"
                    fill="none"
                    stroke="currentColor"
                    strokeLinejoin="bevel"
                />
            </svg>
        </button>
    );
}
