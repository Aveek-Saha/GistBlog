import { fetchGistById } from "../../../lib/github";
// import styles from "../../page.module.css";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface PostPageProps {
    params: {
        gistId: string;
    };
}

export default async function PostPage({ params }: PostPageProps) {
    const { gistId } = await params;

    try {
        const markdownContent = await fetchGistById(gistId);

        return (
            <div>
                <h1>Post</h1>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                >
                    {markdownContent}
                </ReactMarkdown>
            </div>
        );
    } catch (error) {
        return (
            <div>
                <h1>Error</h1>
                <p>{(error as Error).message}</p>
            </div>
        );
    }
}
