import React, { useEffect, useState } from "react";
import axios from "axios";
import ProfileHeader from "./components/ProfileHeader";
import PublicationsList from "./components/PublicationsList";
import Statistics from "./components/Statistics";
import CoAuthors from "./components/CoAuthors";
import FileUpload from "./components/FileUpload";
import "./App.css";

function App() {
    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fileUploaded, setFileUploaded] = useState(false); // Track file upload state

    // Fetch publications after upload
    useEffect(() => {
        if (fileUploaded) {
            const fetchPublications = async () => {
                try {
                    const response = await axios.get("http://localhost:5000/api/publications");
                    if (response && response.data) {
                        setPublications(response.data);
                        console.log(response.data);
                    } else {
                        setError("No data returned from the API.");
                    }
                } catch (error) {
                    setError("Error fetching publications: " + error.message);
                    console.error("Error fetching publications:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchPublications();
        }
    }, [fileUploaded]); // Fetch data only when fileUploaded is true

    // Show file upload UI first
    if (!fileUploaded) {
        return <FileUpload onUploadSuccess={() => setFileUploaded(true)} />;
    }

    // Show main UI after file upload
    return (
        <div className="app-container">
            <div className="left-panel">
                <ProfileHeader />
                <PublicationsList publications={publications} />
            </div>
            <div className="right-panel">
                <Statistics publications={publications} />
                <CoAuthors publications={publications} />
            </div>
        </div>
    );
}

export default App;
