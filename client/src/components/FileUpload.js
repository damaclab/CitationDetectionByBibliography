import React, { useState } from "react";
import axios from "axios";
import './FileUpload.css'

const REQUIRED_COLUMNS = ["Authors", "Source title", "Cited by", "Year"];

const FileUpload = ({ onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setError("");
        setInfo("");
    };

    const validateCSV = async (file) => {
        const text = await file.text();
        const lines = text.split("\n");
        const headers = lines[0].trim().split(",");

        const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
        if (missing.length > 0) {
            throw new Error(`Missing required column(s): ${missing.join(", ")}`);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first!");
            return;
        }

        try {
            await validateCSV(file);

            const formData = new FormData();
            formData.append("file", file);

            await axios.post("http://localhost:5000/api/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setInfo("File uploaded successfully.");
            onUploadSuccess(); // Notify App.js
        } catch (err) {
            setError(err.message || "Error uploading file.");
            console.error("Upload error:", err);
        }
    };

    return (
        <div className="upload-container">
            <h2>Upload CSV File</h2>
            <p className="note">Required columns: <strong>{REQUIRED_COLUMNS.join(", ")}</strong></p>
            <input type="file" accept=".csv" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>
            {error && <p className="error">{error}</p>}
            {info && <p className="success">{info}</p>}
        </div>
    );
};

export default FileUpload;
