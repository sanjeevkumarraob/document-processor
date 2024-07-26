import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [applicantId, setApplicantId] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState({});

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setVerification({});

    const formData = new FormData();
    formData.append("document", file);
    formData.append("applicantId", applicantId);

    try {
      // In your axios call, change the URL to:
      const response = await axios.post("/api/upload", formData);
      console.log("reponse >> ",response.data);
      console.log("document.extractedInfo >> ",response.data.data.document.extractedInfo);
      setResult(response.data);
      verifyInformation(response.data.data.document.extractedInfo);
    } catch (error) {
      console.error("Error:", error);
      setResult({
        status: "error",
        message: "An error occurred while processing the document.",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyInformation = (extractedInfo) => {
    console.log("Name",extractedInfo.name);
    console.log("Address",extractedInfo.address);
    const verification = {
      name: extractedInfo.name?.toLowerCase() === name.toLowerCase(),
      dob: extractedInfo.dateOfBirth === dob,
      address: extractedInfo.address
        ?.toLowerCase()
        .includes(address.toLowerCase()),
    };
    setVerification(verification);
  };

  return (
    <div className="App">
      <h1>Document Upload and Verification</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="document">Select Document:</label>
          <input
            type="file"
            id="document"
            onChange={handleFileChange}
            required
          />
        </div>
        <div>
          <label htmlFor="applicantId">Applicant ID:</label>
          <input
            type="text"
            id="applicantId"
            value={applicantId}
            onChange={(e) => setApplicantId(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="dob">Date of Birth:</label>
          <input
            type="date"
            id="dob"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="address">Address:</label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          Upload and Verify
        </button>
      </form>

      {loading && <div className="loading">Processing... Please wait.</div>}

      {result && (
        <div className="result">
          <h2>Analysis Result:</h2>
          <p>
            <strong>Document Type:</strong> {result.data.document.type}
          </p>
          <p>
            <strong>Extracted Info:</strong>
          </p>
          <pre>
            {JSON.stringify(result.data.document.extractedInfo, null, 2)}
          </pre>
          <p>
            <strong>Document Hash:</strong> {result.data.document.hash}
          </p>
          <p>
            <strong>Blockchain Transaction Hash:</strong>{" "}
            {result.data.blockchain.transactionHash}
          </p>
          <p>
            <strong>Processed At:</strong> {result.data.metadata.processedAt}
          </p>
          <p>
            <strong>Applicant ID:</strong> {result.data.metadata.applicantId}
          </p>
        </div>
      )}

      {Object.keys(verification).length > 0 && (
        <div className="verification">
          <h2>Verification Results:</h2>
          <p>
            <strong>Name:</strong>{" "}
            {verification.name ? "✅ Matched" : "❌ Not Matched"}
          </p>
          <p>
            <strong>Date of Birth:</strong>{" "}
            {verification.dob ? "✅ Matched" : "❌ Not Matched"}
          </p>
          <p>
            <strong>Address:</strong>{" "}
            {verification.address ? "✅ Matched" : "❌ Not Matched"}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
