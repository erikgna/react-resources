import React, { useState } from 'react';
import axios, { type AxiosProgressEvent } from 'axios';
import { ProgressBar } from './ProgressBar';

export const FileTransferAxios = () => {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [status, setStatus] = useState('');

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setStatus('Uploading...');
            setUploadProgress(0);

            await axios.post('https://jsonplaceholder.typicode.com/posts', formData, {
                onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percent);
                    }
                },
            });

            setStatus('Upload Complete!');
        } catch (error) {
            console.error('Upload error:', error);
            setStatus('Upload Failed');
        }
    };

    const handleDownload = async () => {
        try {
            setStatus('Downloading...');
            setDownloadProgress(0);

            const response = await axios.get('https://fetch-progress-demo.api.com/large-asset.zip', {
                responseType: 'blob',
                onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setDownloadProgress(percent);
                    }
                },
            });

            setStatus('Download Complete!');
            console.log('Downloaded blob size:', response.data.size);
        } catch (error) {
            console.error('Download error:', error);
            setStatus('Download Failed');
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '400px' }}>
            <h3>File Manager (Axios)</h3>
            <p>Status: <strong>{status}</strong></p>

            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Upload File: </label>
                <input type="file" onChange={handleUpload} />
                <ProgressBar progress={uploadProgress} label="Upload" />
            </div>

            <hr />

            <div style={{ marginTop: '20px' }}>
                <button onClick={handleDownload} style={{ marginBottom: '8px' }}>
                    Start Download
                </button>
                <ProgressBar progress={downloadProgress} label="Download" />
            </div>
        </div>
    );
};