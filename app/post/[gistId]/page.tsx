import { fetchGistById } from "../../../lib/github";

interface PostPageProps {
    params: {
        gistId: string;
    };
}

export default async function PostPage({ params }: PostPageProps) {
    const { gistId } = await params;
    const markdownContent = await fetchGistById(gistId);

    return (
        <div>
            <h1>Blog Post</h1>
            <div>{markdownContent}</div>
        </div>
    );
}
