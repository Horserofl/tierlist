// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB1p5rT6r_upDMtyF_HQJY8BSLWnvnU368",
  authDomain: "tierlist-e6b2d.firebaseapp.com",
  projectId: "tierlist-e6b2d",
  storageBucket: "tierlist-e6b2d.firebasestorage.app",
  messagingSenderId: "950824741924",
  appId: "1:950824741924:web:3ef7ad447b868d91497cb1",
  measurementId: "G-27RXGHB10T"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { db };