import Link from "next/link";

export default function NotFound() {
    return (
        <main className="state-page">
            <p className="state-code">ERROR 404</p>
            <h1>Not found</h1>
            <p>The GitHub user, gist, or blog page you requested does not exist.</p>
            <Link className="action-button" href="/">
                Return home
            </Link>
        </main>
    );
}
