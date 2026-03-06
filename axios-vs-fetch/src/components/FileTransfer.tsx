import React, { useState } from 'react';

const FileTransfer = () => {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [status, setStatus] = useState('');

    // --- UPLOAD LOGIC (Using XHR for Progress) ---
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        setStatus('Uploading...');

        // This is the key for upload progress
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percent);
            }
        });

        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                setStatus(xhr.status === 201 || xhr.status === 200 ? 'Upload Complete!' : 'Upload Failed');
            }
        };

        xhr.open('POST', 'https://jsonplaceholder.typicode.com/posts'); // Using mock API
        xhr.send(formData);
    };

    // --- DOWNLOAD LOGIC (Using Fetch + ReadableStream) ---
    const handleDownload = async () => {
        setStatus('Downloading...');
        setDownloadProgress(0);

        // Using a large image for demonstration
        const response = await fetch('https://fetch-progress-demo.api.com/large-asset.zip');

        if (!response.body) return;

        const contentLength = +(response.headers.get('Content-Length') || 0);
        const reader = response.body.getReader();

        let receivedLength = 0;
        const chunks = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            receivedLength += value.length;

            if (contentLength) {
                const percent = Math.round((receivedLength / contentLength) * 100);
                setDownloadProgress(percent);
            }
        }

        setStatus('Download Complete!');
        // Construct the file from chunks if you want to save it
        const blob = new Blob(chunks);
        console.log('Downloaded blob size:', blob.size);
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h3>File Manager</h3>
            <p>Status: <strong>{status}</strong></p>

            {/* Upload Section */}
            <div style={{ marginBottom: '20px' }}>
                <label>Upload File: </label>
                <input type="file" onChange={handleUpload} />
                <ProgressBar progress={uploadProgress} label="Upload" />
            </div>

            <hr />

            {/* Download Section */}
            <div style={{ marginTop: '20px' }}>
                <button onClick={handleDownload}>Start Download</button>
                <ProgressBar progress={downloadProgress} label="Download" />
            </div>
        </div>
    );
};

// Simple reusable Progress Bar component
const ProgressBar = ({ progress, label }: { progress: number; label: string }) => (
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

export default FileTransfer;