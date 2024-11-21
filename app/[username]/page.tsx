import { fetchGists } from "../../lib/github";

interface Gist {
    id: string;
    files: {
        [key: string]: {
            filename: string;
        };
    };
}

interface UserPostsPageProps {
    params: {
        username: string;
    };
}

export default async function UserPostsPage({ params }: UserPostsPageProps) {
    const { username } = await params;
    const gists: Gist[] = await fetchGists(username);

    return (
        <div>
            <h1>{username}'s Gists</h1>
            <ul>
                {gists.map((gist) => {
                    // Get the first file's name in the gist
                    const fileName = Object.values(gist.files)[0].filename;

                    return (
                        <li key={gist.id}>
                            <a href={`/post/${gist.id}`}>{fileName}</a>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
