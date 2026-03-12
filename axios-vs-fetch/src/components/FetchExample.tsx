import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useFetch';

interface Post {
    id: number;
    title: string;
}

export const FetchExample = () => {
    const [query, setQuery] = useState('');
    const { data: posts, isLoading, execute } = useApi<Post[]>('/posts');
    
    useEffect(() => {
        if (query.length > 2) execute({ params: { q: query } });
    }, [query, execute]);

    return (
        <div style={{ padding: '20px' }}>
            <h3>Live Search (with AbortController)</h3>
            <input
                type="text"
                placeholder="Type to search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ padding: '8px', width: '100%', marginBottom: '10px' }}
            />

            {isLoading && <p>Searching...</p>}

            <ul>
                {posts?.map(post => <li key={post.id}>{post.title}</li>)}
            </ul>
        </div>
    );
};