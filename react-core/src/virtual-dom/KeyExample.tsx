const users = [
    { id: 101, name: 'Alice' },
    { id: 102, name: 'Bob' },
    { id: 103, name: 'Charlie' },
];

// When rendering lists of elements, always use a unique key for each item. This helps React efficiently track and update individual elements without reordering or re-rendering the entire list.
export function KeyExample() {
    return (
        <ul>
            {users.map((user) => (
                <li key={user.id}>
                    {user.name}
                </li>
            ))}
        </ul>
    );
}