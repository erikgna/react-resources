import React, { useState } from 'react';
import { ProgressBar } from './ProgressBar';

export const FileTransferFetch = () => {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [status, setStatus] = useState('');

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        setStatus('Uploading...');

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percent);
            }
        });

        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) setStatus(xhr.status === 201 || xhr.status === 200 ? 'Upload Complete!' : 'Upload Failed');
        };

        xhr.open('POST', 'https://jsonplaceholder.typicode.com/posts');
        xhr.send(formData);
    };

    const handleDownload = async () => {
        setStatus('Downloading...');
        setDownloadProgress(0);

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
        const blob = new Blob(chunks);
        console.log('Downloaded blob size:', blob.size);
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h3>File Manager</h3>
            <p>Status: <strong>{status}</strong></p>

            <div style={{ marginBottom: '20px' }}>
                <label>Upload File: </label>
                <input type="file" onChange={handleUpload} />
                <ProgressBar progress={uploadProgress} label="Upload" />
            </div>

            <hr />

            <div style={{ marginTop: '20px' }}>
                <button onClick={handleDownload}>Start Download</button>
                <ProgressBar progress={downloadProgress} label="Download" />
            </div>
        </div>
    );
};