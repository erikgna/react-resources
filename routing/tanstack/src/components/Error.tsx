export default function Error({ error }: { error: Error }) {
    return <div className="text-red-500">Error: {error.message}</div>
}