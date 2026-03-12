export const ProgressBar = ({ progress, label }: { progress: number; label: string }) => (
    <div style={{ marginTop: '10px' }}>
        <small>{label}: {progress}%</small>
        <div style={{ width: '100%', backgroundColor: '#eee', borderRadius: '4px', height: '10px' }}>
            <div style={{
                width: `${progress}%`,
                backgroundColor: progress === 100 ? '#4caf50' : '#2196f3',
                height: '100%',
                borderRadius: '4px',
                transition: 'width 0.2s ease-in-out'
            }} />
        </div>
    </div>
);