// src/firebase/firestore.js
import { getFirestore } from 'firebase/firestore';
import { app } from './app';

export const db = getFirestore(app);
