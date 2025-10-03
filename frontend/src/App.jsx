// frontend/src/App.jsx

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown'; // <--- NEW IMPORT
import './App.css'; 

function App() {
  // ... (query, analysis, isLoading states remain the same)
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState('Your grounded financial analysis will appear here.');
  const [isLoading, setIsLoading] = useState(false);
  
  // --- NEW STATE: to store the list of sources ---
  const [sources, setSources] = useState([]); 

 const API_URL = 'https://grounded-analyst-api.onrender.com/';

  const handleAnalysis = async () => {
    if (!query.trim()) {
      alert("Please enter a financial query to analyze.");
      return;
    }

    setIsLoading(true);
    setSources([]);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success: Update analysis AND sources
        setAnalysis(data.analysis);
        // --- NEW: Handle sources array, default to empty array if none ---
        setSources(data.sources || []); 
      } else {
        // ... (error handling remains the same)
        setAnalysis(`Error: ${data.error || 'Could not connect to the analyst engine.'}`);
        setSources([]);
      }
    } catch (error) {
      // ... (network error handling remains the same)
      console.error('Fetch error:', error);
      setAnalysis('A network error occurred. Check if the Python backend is running and the port is correct.');
      setSources([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>The Grounded Analyst 🧠💰</h1>
        <p>Real-time, professional financial analysis.</p>
      </header>

      <div className="container">
        <textarea
          className="query-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Summarize Tesla's last quarter earnings and provide a risk outlook."
          rows="5"
          disabled={isLoading}
        ></textarea>

        <button
          className="analyze-button"
          onClick={handleAnalysis}
          disabled={isLoading}
        >
          {isLoading ? 'ANALYZING...' : 'GET ANALYSIS'}
        </button>

        {isLoading && (
          <div className="loading-area">
            <div className="spinner"></div>
            <p>Consulting Senior Analyst Data...</p>
          </div>
        )}

        {/* Output Area - Modified to use ReactMarkdown and display sources */}
        <div className="analysis-output">
          <h2>Senior Analyst Report:</h2>
          
          {/* --- CHANGE 1: Use ReactMarkdown to render the analysis --- */}
          <div className="markdown-content">
              <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
          
          {/* --- CHANGE 2: Conditionally display sources --- */}
          {sources.length > 0 && (
            <div className="sources-list">
              <h3>Sources Used:</h3>
              <ul>
                {sources.map((source, index) => (
                  <li key={index}>
                    <a href={source.uri} target="_blank" rel="noopener noreferrer">
                      {source.uri}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
      <footer className="App-footer">
        <p>Powered by Google Gemini API & Google Search Grounding</p>
        <p>© {new Date().getFullYear()} The Grounded Analyst Project</p>
      </footer>
    </div>
  );
}

export default App;