import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './AuthContext.jsx';
import { UserContextProvider } from './UserContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <UserContextProvider>
                <Router>
                    <App />
                </Router>
            </UserContextProvider>
        </AuthProvider>
    </React.StrictMode>
);
