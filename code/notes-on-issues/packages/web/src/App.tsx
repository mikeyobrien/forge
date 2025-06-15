// ABOUTME: Minimal React application entry rendering hello world header
// ABOUTME: Used for the Notes-on-Issues PWA bootstrap
import type { JSX } from 'react';
import './App.css';

function App(): JSX.Element {
  return (
    <div className="app-container">
      <h1>Hello Notes</h1>
    </div>
  );
}

export default App;
