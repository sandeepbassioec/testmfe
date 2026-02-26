import React from 'react';

const Simple: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontSize: '16px' }}>
      <h1>Welcome to MFE Framework</h1>
      <p>App is running! ✓</p>
      <p>This is a simple test page to verify React is working.</p>
      <hr />
      <p>
        <strong>If you can see this message:</strong>
      </p>
      <ul>
        <li>React is properly rendering</li>
        <li>The dev server is working</li>
        <li>CSS is loading</li>
      </ul>
      <p>
        <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
          Go to main page
        </a>
      </p>
    </div>
  );
};

export default Simple;
