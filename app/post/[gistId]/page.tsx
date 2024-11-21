export default async function Page({
    params,
}: {
    params: Promise<{ gistId: string }>;
}) {
    const gistId = (await params).gistId;
    return <div>My Post: {gistId}</div>;
}
