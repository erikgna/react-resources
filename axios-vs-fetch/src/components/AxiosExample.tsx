import { useState, useEffect } from 'react';
import { useAxios } from '../hooks/useAxios';

interface Post {
    id: number;
    title: string;
}

export const AxiosExample = () => {
    const [query, setQuery] = useState('');

    const { data: posts, isLoading, execute } = useAxios<Post[]>('/posts', {useCache: true});

    useEffect(() => {
        if (query.length > 2) execute({ params: { q: query } }).catch(() => {});
    }, [query, execute]);

    return (
        <div style={{ padding: '20px', maxWidth: '500px' }}>
            <h3>Live Search (Axios + AbortController)</h3>
            <input
                type="text"
                placeholder="Search posts..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ 
                    padding: '10px', 
                    width: '100%', 
                    borderRadius: '4px', 
                    border: '1px solid #ccc' 
                }}
            />

            {isLoading && <p style={{ color: '#666' }}>Fetching results...</p>}

            <ul style={{ marginTop: '20px' }}>
                {posts?.map(post => <li key={post.id} style={{ marginBottom: '8px' }}><strong>{post.title}</strong></li>)}
                {!isLoading && query.length > 2 && posts?.length === 0 && <p>No results found.</p>}
            </ul>
        </div>
    );
};