import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBNF-PWd7p3Hitw9kW0eLXPNO03Vdtpn6E",
  authDomain: "studentscore-48c09.firebaseapp.com",
  projectId: "studentscore-48c09",
  storageBucket: "studentscore-48c09.firebasestorage.app",
  messagingSenderId: "1026210844204",
  appId: "1:1026210844204:web:0b7dfef59066dec8a1cb89",
  measurementId: "G-2PQLYG56TF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };