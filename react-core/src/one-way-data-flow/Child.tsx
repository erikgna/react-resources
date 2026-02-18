export function Child({ name, onNameChange }: { name: string, onNameChange: (newName: string) => void }) {
    return (
        <div>
            <input type="text" value={name} onChange={(e) => onNameChange(e.target.value)} />
            <button onClick={() => onNameChange(name)}>Change Name</button>
        </div>
    );
}