/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyACy8zAUfdZDLMibggS3yybaJFO2zfoQA8",
  authDomain: "roteiroelismar.firebaseapp.com",
  projectId: "roteiroelismar",
  storageBucket: "roteiroelismar.firebasestorage.app",
  messagingSenderId: "750940261190",
  appId: "1:750940261190:web:e996240b587e86c0e43347",
  measurementId: "G-YFJPP5CN15"
};

// Initialize Firebase safely (avoiding double initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signInWithEmailAndPassword, signOut };
