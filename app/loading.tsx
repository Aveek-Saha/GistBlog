export default function Loading() {
    return (
        <main className="loading-page" aria-label="Loading page" aria-busy="true">
            <div className="loading-line loading-line-short" />
            <div className="loading-line loading-line-title" />
            <div className="loading-line loading-line-copy" />
            <span className="sr-only">Loading…</span>
        </main>
    );
}
