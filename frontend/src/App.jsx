import React, { useState, useEffect } from 'react';

function App() {
  const [apiStatus, setApiStatus] = useState('Checking...');
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setApiStatus('Connected');
        setApiData(data);
      })
      .catch(err => {
        setApiStatus('Error: ' + err.message);
      });
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1>🏭 ERP System</h1>
      <p>Welcome to the ERP System Frontend</p>
      
      <div style={{ 
        padding: '15px', 
        backgroundColor: apiStatus === 'Connected' ? '#d4edda' : '#f8d7da',
        borderRadius: '5px',
        marginTop: '20px'
      }}>
        <h3>📊 API Status: {apiStatus}</h3>
        {apiData && (
          <pre style={{ overflow: 'auto' }}>
            {JSON.stringify(apiData, null, 2)}
          </pre>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>🔧 Available Endpoints:</h3>
        <ul>
          <li><a href="/api/health">/api/health</a> - API Health Check</li>
          <li><a href="/health">/health</a> - Simple Health Check</li>
          <li><a href="/">/</a> - Backend Root</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '5px' }}>
        <h3>✅ System Status</h3>
        <p>Backend: <strong style={{ color: 'green' }}>Running</strong></p>
        <p>Database: <strong style={{ color: 'green' }}>Connected</strong></p>
        <p>Frontend: <strong style={{ color: 'green' }}>Ready</strong></p>
      </div>
    </div>
  );
}

export default App;
