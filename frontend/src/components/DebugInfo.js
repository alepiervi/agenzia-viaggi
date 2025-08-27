import React, { useState } from 'react';
import axios from 'axios';

const DebugInfo = () => {
  const [debugResult, setDebugResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const testBackendConnection = async () => {
    setIsLoading(true);
    
    // Test multiple URLs
    const urlsToTest = [
      'http://localhost:8001/api/auth/login',
      'https://travelagent.preview.emergentagent.com/api/auth/login'
    ];
    
    const results = {};
    
    for (const url of urlsToTest) {
      try {
        console.log(`Testing URL: ${url}`);
        const response = await axios.post(url, {
          email: 'admin@test.com',
          password: 'password123'
        });
        results[url] = {
          success: true,
          status: response.status,
          data: response.data
        };
      } catch (error) {
        results[url] = {
          success: false,
          error: error.message,
          details: error.response?.data || 'Network error'
        };
      }
    }
    
    // Also test environment variables
    const envInfo = {
      REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
      NODE_ENV: process.env.NODE_ENV,
      currentHost: window.location.host,
      userAgent: navigator.userAgent
    };
    
    setDebugResult({
      urls: results,
      environment: envInfo,
      timestamp: new Date().toISOString()
    });
    
    setIsLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#f5f5f5' }}>
      <h2>🔧 Travel Agency Debug Info</h2>
      
      <button 
        onClick={testBackendConnection}
        disabled={isLoading}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none',
          borderRadius: '5px',
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {isLoading ? 'Testing...' : 'Test Backend Connection'}
      </button>
      
      {debugResult && (
        <div style={{ marginTop: '20px' }}>
          <h3>🌐 URL Test Results:</h3>
          {Object.entries(debugResult.urls).map(([url, result]) => (
            <div key={url} style={{ margin: '10px 0', padding: '10px', backgroundColor: 'white', border: '1px solid #ddd' }}>
              <strong>URL:</strong> {url}<br/>
              <strong>Status:</strong> {result.success ? '✅ SUCCESS' : '❌ FAILED'}<br/>
              {result.success ? (
                <>
                  <strong>HTTP Status:</strong> {result.status}<br/>
                  <strong>User:</strong> {result.data?.user?.email} ({result.data?.user?.role})<br/>
                  <strong>Token:</strong> {result.data?.token ? 'Present' : 'Missing'}
                </>
              ) : (
                <>
                  <strong>Error:</strong> {result.error}<br/>
                  <strong>Details:</strong> {JSON.stringify(result.details)}
                </>
              )}
            </div>
          ))}
          
          <h3>🔧 Environment Info:</h3>
          <div style={{ padding: '10px', backgroundColor: 'white', border: '1px solid #ddd' }}>
            {Object.entries(debugResult.environment).map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {value || 'undefined'}
              </div>
            ))}
          </div>
          
          <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
            Test completed at: {debugResult.timestamp}
          </p>
        </div>
      )}
    </div>
  );
};

export default DebugInfo;