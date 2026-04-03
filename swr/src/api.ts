export async function fetcher(url: string) {
    await new Promise((r) => setTimeout(r, 500))

    if (url.includes("error")) {
        throw new Error("Failed to fetch")
    }

    if (url.includes("users")) {
        const page = Number(url.split("page=")[1]) || 1

        return Array.from({ length: 3 }).map((_, i) => ({
            id: `${page}-${i}`,
            name: `User ${page}-${i}`,
        }))
    }

    return {
        id: "1",
        name: "John Doe",
        avatar: "https://i.pravatar.cc/150?img=3",
        updatedAt: new Date().toISOString(),
    }
}