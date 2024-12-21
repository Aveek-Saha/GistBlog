import { fetchGists, Owner } from "../../lib/github";

interface UserPostsPageProps {
    params: Promise<{ username: string }>;
}

export default async function UserPostsPage({ params }: UserPostsPageProps) {
    const { username } = await params;
    const gists = await fetchGists(username);

    var owner: Owner = { login: "", avatar_url: "", html_url: "" };
    if (gists.length > 0) owner = gists[0].owner;

    return (
        <div>
            <div className="header">
                <h1 className=" user-info">
                    <a href={owner.html_url} className="link">
                        {owner.login}
                    </a>
                    's Blog
                    <img
                        className="profile-picture"
                        src={owner.avatar_url}
                        alt={owner.login}
                    />
                </h1>
            </div>
            <div className="posts">
                <ul className="post-list">
                    {gists.map((gist) => {
                        const fileName = Object.values(gist.files)[0]?.filename;
                        const metadata = gist.metadata;

                        return (
                            <li key={gist.id}>
                                <a href={`/post/${gist.id}`} className="link">
                                    <div className="post-content">
                                        <h4>
                                            {fileName
                                                ?.replace(/_/g, " ")
                                                .replace(/\.md$/, "")}
                                        </h4>
                                        <div className="post-description">
                                            {gist.description}
                                        </div>
                                    </div>
                                    <div className="post-date">
                                        {new Date(
                                            gist.created_at
                                        ).toLocaleDateString("en-US", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </div>
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
