import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Firebase Implementation
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDj9UpR2G8ktc3siRj7r_nWool3QElTUOI",
  authDomain: "gestorderotas-elismar.firebaseapp.com",
  projectId: "gestorderotas-elismar",
  storageBucket: "gestorderotas-elismar.firebasestorage.app",
  messagingSenderId: "639978122524",
  appId: "1:639978122524:web:565f7e1ffbf2a10eae5ed9",
  measurementId: "G-M07TY6H92D"
};

const app = initializeApp(firebaseConfig);
if (typeof window !== 'undefined') {
  getAnalytics(app);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)