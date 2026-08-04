import Link from "next/link";

export default function NotFound() {
    return (
        <main>
            <h1>Not found</h1>
            <p>The GitHub user, gist, or blog page could not be found.</p>
            <Link href="/">Return to GistBlog</Link>
        </main>
    );
}
