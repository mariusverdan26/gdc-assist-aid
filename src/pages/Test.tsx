import React from 'react';

export default function Test() {
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', color: 'black' }}>
      <h1>Test Page</h1>
      <p>If you can see this, the basic React app is working!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
}
