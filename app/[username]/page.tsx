import { fetchGists } from "../../lib/github";
import styles from "../page.module.css";

interface UserPostsPageProps {
    params: {
        username: string;
    };
}

export default async function UserPostsPage({ params }: UserPostsPageProps) {
    const { username } = await params;
    const gists = await fetchGists(username);

    return (
        <div className={styles.page}>
            <h1>{username}'s Gists</h1>
            <ul>
                {gists.map((gist) => {
                    const fileName = Object.values(gist.files)[0]?.filename;
                    const metadata = gist.metadata;

                    return (
                        <li key={gist.id}>
                            <a href={`/post/${gist.id}`}>
                                <strong>{metadata?.heading || fileName}</strong>
                            </a>
                            {metadata && (
                                <div>
                                    <p>Date: {metadata.date || "Unknown"}</p>
                                    <p>Time: {metadata.time || "Unknown"}</p>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
