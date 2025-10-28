// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA8Y5FS58SHN18Kt8eHHYoyB0MRx5CLytE",
  authDomain: "smartchild-2e350.firebaseapp.com",
  databaseURL: "https://smartchild-2e350-default-rtdb.firebaseio.com",
  projectId: "smartchild-2e350",
  storageBucket: "smartchild-2e350.firebasestorage.app",
  messagingSenderId: "683277352301",
  appId: "1:683277352301:web:99cc889ade7915353c2e64",
  measurementId: "G-JSVT1WSGEH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);

export default app;
