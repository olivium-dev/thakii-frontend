import React from 'react';

export default function SimpleTest() {
  console.log('SimpleTest component is rendering');
  
  return (
    <div style={{ 
      padding: '40px', 
      fontSize: '24px', 
      backgroundColor: '#f0f9ff',
      color: '#0369a1',
      border: '3px solid #0284c7',
      margin: '20px',
      borderRadius: '10px',
      textAlign: 'center'
    }}>
      <h1>🎉 SUCCESS! React is Working!</h1>
      <p>The application is loading correctly.</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
      
      <div style={{ marginTop: '20px', fontSize: '16px' }}>
        <h3>Environment Variables:</h3>
        <pre style={{ 
          background: '#1e293b', 
          color: '#e2e8f0', 
          padding: '10px', 
          borderRadius: '5px',
          textAlign: 'left',
          fontSize: '14px'
        }}>
          {JSON.stringify({
            NODE_ENV: import.meta.env.MODE,
            FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY ? 'SET' : 'MISSING',
            DEV: import.meta.env.DEV,
            PROD: import.meta.env.PROD,
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}